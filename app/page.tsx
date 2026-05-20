"use client"

import Link from "next/link"

export default function Home() {
  return (
    <div
      style={{
        padding: "40px",
        textAlign: "center",
      }}
    >
      <h1>
        Application Stock
      </h1>

      <br />

      <Link href="/login">
        <button>
          Connexion
        </button>
      </Link>

      <br />
      <br />

      <Link href="/tech">
        <button>
          Accès Technicien
        </button>
      </Link>

      <br />
      <br />

      <Link href="/admin">
        <button>
          Accès Admin
        </button>
      </Link>
    </div>
  )
}