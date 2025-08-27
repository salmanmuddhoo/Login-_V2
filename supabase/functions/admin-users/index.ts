import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface User {
  id: string
  email: string
  full_name: string
  role_id: string
  menu_access: string[]
  sub_menu_access: Record<string, string[]>
  component_access: string[]
  is_active: boolean
  needs_password_reset: boolean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const frontendBaseUrl = Deno.env.get('FRONTEND_BASE_URL') || 'http://localhost:5173'
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role_id, roles(name)')
      .eq('id', user.id)
      .single()

    if (userError || !userData || userData.roles?.name !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const method = req.method

    // GET users
    if (method === 'GET' && url.pathname.endsWith('/admin-users')) {
      const { data: users, error } = await supabase
        .from('users')
        .select(`
          id, email, full_name, role_id, menu_access, 
          sub_menu_access, component_access, is_active, created_at, needs_password_reset,
          roles(name, description)
        `)
        .order('created_at', { ascending: false })

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      return new Response(JSON.stringify({ users }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // POST create user
    if (method === 'POST' && url.pathname.endsWith('/admin-users')) {
      const body = await req.json()
      const { email, password, full_name, role_id, menu_access, sub_menu_access, component_access } = body

      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      })

      if (authError) return new Response(JSON.stringify({ error: authError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      const { data: newUser, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          email,
          full_name,
          role_id,
          menu_access: menu_access || [],
          sub_menu_access: sub_menu_access || {},
          component_access: component_access || [],
          needs_password_reset: true
        })
        .select(`
          id, email, full_name, role_id, menu_access, 
          sub_menu_access, component_access, is_active, created_at, needs_password_reset,
          roles(name, description)
        `)
        .single()

      if (profileError) {
        await supabase.auth.admin.deleteUser(authUser.user.id)
        return new Response(JSON.stringify({ error: profileError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Always send password reset email
      try {
        const { error: resetError } = await supabase.auth.admin.generateLink({
          type: 'password_reset',
          email: email,
          redirectTo: `${frontendBaseUrl}/reset-password`
        })
        if (resetError) console.error('Failed to send password reset email:', resetError)
      } catch (err) {
        console.error('Error sending password reset email:', err)
      }

      return new Response(JSON.stringify({ user: newUser }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // PUT update user
    if (method === 'PUT') {
      const userId = url.pathname.split('/').pop()
      const body = await req.json()
      const { full_name, role_id, menu_access, sub_menu_access, component_access, is_active, needs_password_reset } = body

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({ full_name, role_id, menu_access, sub_menu_access, component_access, is_active, needs_password_reset })
        .eq('id', userId)
        .select(`
          id, email, full_name, role_id, menu_access, 
          sub_menu_access, component_access, is_active, created_at, needs_password_reset,
          roles(name, description)
        `)
        .single()

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      // Always send password reset email if needs_password_reset is true
      if (needs_password_reset) {
        try {
          const { data: currentUser } = await supabase.from('users').select('email').eq('id', userId).single()
          if (currentUser?.email) {
            const { error: resetError } = await supabase.auth.admin.generateLink({
              type: 'password_reset',
              email: currentUser.email,
              redirectTo: `${frontendBaseUrl}/reset-password`
            })
            if (resetError) console.error('Failed to send password reset email:', resetError)
          }
        } catch (err) {
          console.error('Error sending password reset email:', err)
        }
      }

      return new Response(JSON.stringify({ user: updatedUser }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // DELETE user
    if (method === 'DELETE') {
      const userId = url.pathname.split('/').pop()
      const { error: authError } = await supabase.auth.admin.deleteUser(userId!)
      if (authError) return new Response(JSON.stringify({ error: authError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      return new Response(JSON.stringify({ message: 'User deleted successfully' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
