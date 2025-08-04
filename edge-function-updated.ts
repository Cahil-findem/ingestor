import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

serve(async (req) => {
  // Handle CORS preflight (OPTIONS) requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: CORS_HEADERS,
      status: 204
    });
  }

  try {
    const requestBody = await req.json();
    
    // Handle both new structured format and legacy array format for backward compatibility
    let profiles: any[];
    let label: string | null = null;
    
    if (Array.isArray(requestBody)) {
      // Legacy format: direct array of profiles
      profiles = requestBody;
      console.log("Using legacy format: direct array of profiles");
    } else if (requestBody && typeof requestBody === 'object') {
      // New format: structured object with profiles and label
      profiles = requestBody.profiles;
      label = requestBody.label || null;
      console.log("Using new format: structured request with label:", label || "none");
    } else {
      return new Response(JSON.stringify({
        error: "Invalid request format. Expected array of profiles or {profiles: [...], label: string}"
      }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    // Validate profiles array
    if (!Array.isArray(profiles)) {
      return new Response(JSON.stringify({
        error: "Expected 'profiles' to be an array"
      }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    if (profiles.length === 0) {
      return new Response(JSON.stringify({
        error: "No profiles provided"
      }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    // --- Log the profile_id of each profile ---
    profiles.forEach((profile) => {
      console.log("Profile incoming:", profile._id);
    });

    // Pack profiles with IDs and include label
    const packed = profiles.map((profile) => {
      const id = profile._id?.$oid || profile._id || crypto.randomUUID();
      return {
        id,
        profile,
        label: label // Add label to each profile record
      };
    });

    console.log(`Inserting ${packed.length} profiles with label: "${label || 'none'}"`);

    // Upsert into public_profiles
    const { error, data } = await fetch(Deno.env.get("SUPABASE_URL") + "/rest/v1/public_profiles", {
      method: "POST",
      headers: {
        "apikey": Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify(packed)
    }).then(async (res) => ({
      data: await res.json(),
      error: !res.ok ? await res.text() : null
    }));

    if (error) {
      console.error("Database insert error:", error);
      return new Response(JSON.stringify({
        error: `Database insert failed: ${error}`
      }), {
        status: 500,
        headers: CORS_HEADERS
      });
    }

    console.log(`Successfully inserted ${packed.length} profiles with label: "${label || 'none'}"`);

    return new Response(JSON.stringify({
      success: true,
      inserted: packed.length,
      label: label,
      message: `Successfully inserted ${packed.length} profile${packed.length === 1 ? '' : 's'}${label ? ` with label "${label}"` : ''}`
    }), {
      headers: CORS_HEADERS,
      status: 201
    });

  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({
      error: `Processing failed: ${err.message}`
    }), {
      status: 400,
      headers: CORS_HEADERS
    });
  }
});