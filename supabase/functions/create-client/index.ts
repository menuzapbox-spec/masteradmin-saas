import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ ok: false, error: "Método não permitido." }, 405)

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) return json({ ok: false, error: "Não autenticado." }, 401)

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const admin = createClient(supabaseUrl, serviceRoleKey)

  const token = authHeader.replace("Bearer ", "")
  const { data: { user }, error: userError } = await admin.auth.getUser(token)

  if (userError || !user) return json({ ok: false, error: "Sessão inválida." }, 401)

  const { data: master, error: masterError } = await admin
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (masterError || !master) {
    return json({ ok: false, error: "Acesso negado. Usuário não é administrador Master." }, 403)
  }

  const body = await req.json()
  const {
    customer_name, email, password, store_name, slug, whatsapp,
    address, neighborhood, city, state, delivery_fee, plan_id
  } = body

  if (!customer_name || !email || !password || !store_name || !slug) {
    return json({
      ok: false,
      error: "Preencha nome, e-mail, senha, nome da loja e slug."
    }, 400)
  }

  if (String(password).length < 8) {
    return json({
      ok: false,
      error: "A senha precisa ter pelo menos 8 caracteres."
    }, 400)
  }

  const normalizedSlug = String(slug).trim().toLowerCase()
  const normalizedEmail = String(email).trim().toLowerCase()

  const { data: existingStore } = await admin
    .from("stores")
    .select("id")
    .eq("slug", normalizedSlug)
    .maybeSingle()

  if (existingStore) {
    return json({ ok: false, error: "Esse slug de loja já está em uso." }, 409)
  }

  const { data: createdUser, error: createUserError } =
    await admin.auth.admin.createUser({
      email: normalizedEmail,
      password: String(password),
      email_confirm: true,
      user_metadata: {
        full_name: customer_name,
        store_name
      }
    })

  if (createUserError) {
    return json({ ok: false, error: createUserError.message }, 400)
  }

  const userId = createdUser.user.id
  let storeId: string | null = null

  try {
    const { data: store, error: storeError } = await admin
      .from("stores")
      .insert({
        name: store_name,
        slug: normalizedSlug,
        description: "Cardápio digital",
        whatsapp: whatsapp || null,
        address: address || null,
        neighborhood: neighborhood || null,
        city: city || null,
        state: state || null,
        delivery_fee: Number(delivery_fee || 0),
        active: true,
        is_open: true
      })
      .select("id")
      .single()

    if (storeError) throw new Error(storeError.message)
    storeId = store.id

    const { error: memberError } = await admin
      .from("store_members")
      .insert({
        store_id: storeId,
        user_id: userId,
        role: "owner",
        active: true
      })

    if (memberError) throw new Error(memberError.message)

    let selectedPlan = plan_id

    if (!selectedPlan) {
      const { data: freePlan, error: freePlanError } = await admin
        .from("plans")
        .select("id")
        .eq("name", "Grátis")
        .single()

      if (freePlanError) throw new Error(freePlanError.message)
      selectedPlan = freePlan.id
    }

    const { error: subscriptionError } = await admin
      .from("subscriptions")
      .insert({
        store_id: storeId,
        plan_id: selectedPlan,
        status: "active"
      })

    if (subscriptionError) throw new Error(subscriptionError.message)

    const { error: settingsError } = await admin
      .from("store_settings")
      .insert({
        store_id: storeId,
        settings: {
          store_name,
          tagline: "Cardápio digital",
          whatsapp: whatsapp || "",
          address: address || "",
          neighborhood: neighborhood || "",
          city: city || "",
          state: state || "",
          delivery_fee: Number(delivery_fee || 0),
          payment_methods: ["pix"],
          theme: {
            primary: "#8b5cf6",
            secondary: "#c9a0dc"
          }
        }
      })

    if (settingsError) throw new Error(settingsError.message)

    return json({
      ok: true,
      store_id: storeId,
      user_id: userId
    })
  } catch (e) {
    if (storeId) {
      await admin.from("stores").delete().eq("id", storeId)
    }

    await admin.auth.admin.deleteUser(userId)

    return json({
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao criar cliente."
    }, 500)
  }
})
