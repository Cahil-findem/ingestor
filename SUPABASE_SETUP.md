# Supabase Integration Setup

This document explains how to set up the Supabase integration for the JSON Profile Ingestor.

## Prerequisites

1. A Supabase project
2. Edge Functions enabled in your Supabase project

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_EDGE_FUNCTION_NAME=data-ingress
```

## Edge Function

The application will call the `data-ingress` edge function that:

1. Accepts an array of profile objects
2. Validates and processes the data
3. Inserts profiles into your database
4. Returns a response with success status and any errors

### Expected Edge Function Input

```typescript
{
  profiles: Array<Record<string, any>>,
  timestamp: string
}
```

### Expected Edge Function Response

```typescript
{
  success: boolean,
  message: string,
  insertedCount?: number,
  errors?: Array<{
    profile: Record<string, any>,
    error: string
  }>
}
```

## How It Works

1. User uploads JSON array (validated locally)
2. Application processes the JSON structure locally
3. Profiles are sent to the Supabase edge function
4. Edge function inserts profiles into the database
5. Application displays upload results with any errors

## Error Handling

The application handles three result types:

- **Success**: All profiles uploaded successfully
- **Warning**: Some profiles uploaded, some failed (partial success)
- **Error**: Upload completely failed

## Development

To run the app in development mode with Supabase integration:

```bash
npm run dev
```

Make sure your `.env` file is configured with valid Supabase credentials.