import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CleanupResult {
  deleted: number;
  failed: number;
  errors: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify this is a scheduled invocation (optional security check)
    const authHeader = req.headers.get("Authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    
    // If CRON_SECRET is set, require it for security
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error("Unauthorized cleanup attempt");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log("Starting report cleanup...");

    // Calculate cutoff time (24 hours ago)
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    console.log("Deleting reports older than:", cutoffTime.toISOString());

    // List all files in the Reports bucket (capital R - matches user's bucket name)
    // Files are stored as "reports/filename.pdf" based on SendReportDialog.tsx
    // Try listing from "reports" folder first, then root if that fails
    let allFiles: any[] = [];
    let listedFromRoot = false;
    
    // First try listing from "reports" folder (where files are actually stored)
    const { data: folderFiles, error: folderError } = await supabaseAdmin.storage
      .from("Reports")
      .list("reports", {
        limit: 1000,
        sortBy: { column: "created_at", order: "asc" },
      });
    
    if (!folderError && folderFiles) {
      allFiles = folderFiles;
      console.log(`Found ${allFiles.length} files in reports/ folder`);
    } else {
      // If that fails, try listing from root
      console.warn("Error listing reports folder, trying root:", folderError?.message);
      listedFromRoot = true;
      
      const { data: rootFiles, error: rootError } = await supabaseAdmin.storage
        .from("Reports")
        .list("", {
          limit: 1000,
          sortBy: { column: "created_at", order: "asc" },
        });
      
      if (rootError) {
        console.error("Error listing files from root:", rootError);
        throw rootError;
      }
      
      allFiles = rootFiles || [];
      console.log(`Found ${allFiles.length} files in root`);
    }

    if (!allFiles || allFiles.length === 0) {
      console.log("No reports found to clean up");
      return new Response(
        JSON.stringify({ 
          success: true, 
          deleted: 0, 
          failed: 0,
          message: "No reports to clean up" 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Found ${allFiles.length} files in reports bucket`);

    const result: CleanupResult = {
      deleted: 0,
      failed: 0,
      errors: [],
    };

    // Process each file
    for (const file of allFiles) {
      try {
        // Skip directories
        if (file.id === null) {
          continue;
        }
        
        // Parse the file's created_at timestamp
        const fileCreatedAt = new Date(file.created_at);
        
        // Check if file is older than 24 hours
        if (fileCreatedAt < cutoffTime) {
          // Construct full path for deletion
          // If we listed from "reports" folder, file.name is just the filename
          // If we listed from root, file.name might include "reports/" prefix
          let filePath: string;
          if (listedFromRoot) {
            // We listed from root, so file.name might already have "reports/" prefix
            filePath = file.name.startsWith("reports/") ? file.name : `reports/${file.name}`;
          } else {
            // We listed from "reports" folder, so file.name is relative to that folder
            // Full path is "reports/" + file.name
            filePath = `reports/${file.name}`;
          }
          
          console.log(`Deleting old report: ${filePath} (created: ${fileCreatedAt.toISOString()})`);
          
          // Delete the file
          const { error: deleteError } = await supabaseAdmin.storage
            .from("Reports")
            .remove([filePath]);

          if (deleteError) {
            console.error(`Failed to delete ${filePath}:`, deleteError);
            result.failed++;
            result.errors.push(`${filePath}: ${deleteError.message}`);
          } else {
            console.log(`Successfully deleted: ${filePath}`);
            result.deleted++;
          }
        } else {
          console.log(`Keeping file ${file.name} (created: ${fileCreatedAt.toISOString()}, not yet 24h old)`);
        }
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        result.failed++;
        result.errors.push(`${file.name}: ${fileError instanceof Error ? fileError.message : "Unknown error"}`);
      }
    }

    console.log("Cleanup completed:", result);

    return new Response(
      JSON.stringify({
        success: true,
        deleted: result.deleted,
        failed: result.failed,
        total: allFiles.length,
        errors: result.errors.length > 0 ? result.errors : undefined,
        message: `Deleted ${result.deleted} report(s), ${result.failed} failed`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in cleanup-reports function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "An error occurred during cleanup",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
