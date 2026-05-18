"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
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
    if (email === "admin@test.com") {
      window.location.href = "/admin"
      return
    }

    // TECHNICIEN
    window.location.href = "/"
  }

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "400px",
        margin: "auto",
      }}
    >
      <h1>Connexion</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) =>
          setEmail(e.target.value)
        }
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
        }}
      />

      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) =>
          setPassword(e.target.value)
        }
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
        }}
      />

      <button
        onClick={login}
        style={{
          width: "100%",
          padding: "10px",
        }}
      >
        Se connecter
      </button>

      <br />
      <br />


    </div>
  )
}