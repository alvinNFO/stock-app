"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const [stock, setStock] = useState([])
  const [user, setUser] = useState(null)

  const fetchUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = "/login"
      return
    }

    setUser(user)

    fetchStock(user.id)
  }

  const fetchStock = async (userId) => {
    const { data } = await supabase
      .from("stock_tech")
      .select(`
        quantite,
        user_id,
        produits (
          id,
          nom,
          reference,
          stock_minimum
        )
      `)
      .eq("user_id", userId)

    setStock(data || [])
  }

  const creerDemande = async (item) => {
    const { data: demandeExistante } = await supabase
      .from("demandes_stock")
      .select("*")
      .eq("user_id", item.user_id)
      .eq("produit_id", item.produits.id)
      .eq("statut", "en attente")

    if (demandeExistante.length > 0) {
      return
    }

    await supabase
      .from("demandes_stock")
      .insert({
        user_id: item.user_id,
        produit_id: item.produits.id,
        quantite: 10,
      })

    alert("Demande envoyée à l'admin")
  }

  const utiliserProduit = async (item) => {
    if (item.quantite <= 0) return

    const nouvelleQuantite = item.quantite - 1

    await supabase
      .from("stock_tech")
      .update({
        quantite: nouvelleQuantite,
      })
      .eq("produit_id", item.produits.id)
      .eq("user_id", item.user_id)

    await supabase
      .from("mouvements_stock")
      .insert({
        user_id: item.user_id,
        produit_id: item.produits.id,
        quantite: 1,
      })

    if (
      nouvelleQuantite <=
      item.produits.stock_minimum
    ) {
      await creerDemande(item)
    }

    fetchStock(item.user_id)
  }

  const logout = async () => {
    await supabase.auth.signOut()

    window.location.href = "/login"
  }

  useEffect(() => {
    fetchUser()
  }, [])

  return (
    <div style={{ padding: "20px" }}>
      <h1>Stock Technicien</h1>

      {user && (
        <div style={{ marginBottom: "20px" }}>
          Connecté : {user.email}

          <br />

          <button onClick={logout}>
            Déconnexion
          </button>
        </div>
      )}

      {stock.map((item, index) => {
        const stockFaible =
          item.quantite <= item.produits.stock_minimum

        return (
          <div
            key={index}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "10px",
              backgroundColor: stockFaible
                ? "#ffdddd"
                : "white",
            }}
          >
            <h3>{item.produits.nom}</h3>

            <p>Réf: {item.produits.reference}</p>

            <p>Quantité: {item.quantite}</p>

            <p>
              Stock minimum :
              {" "}
              {item.produits.stock_minimum}
            </p>

            {stockFaible && (
              <p style={{ color: "red" }}>
                ⚠️ Stock faible
              </p>
            )}

            <button onClick={() => utiliserProduit(item)}>
              Utiliser 1
            </button>
          </div>
        )
      })}
    </div>
  )
}