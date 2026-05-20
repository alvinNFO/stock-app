"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] =
    useState("")

  const login = async () => {
    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    if (error) {
      alert(error.message)
      return
    }

    // ADMIN
    if (
      email ===
      "admin@test.com"
    ) {
      router.push("/admin")
    } else {
      router.push("/tech")
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Connexion</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) =>
          setEmail(e.target.value)
        }
      />

      <br />
      <br />

      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) =>
          setPassword(
            e.target.value
          )
        }
      />

      <br />
      <br />

      <button onClick={login}>
        Se connecter
      </button>
    </div>
  )
}