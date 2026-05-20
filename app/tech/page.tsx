"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function TechPage() {
  const router = useRouter()

  const [stocks, setStocks] = useState<any[]>([])
  const [selectedCategorie, setSelectedCategorie] =
    useState("")

  // CHARGER STOCK
  const fetchStock = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/")
      return
    }

    const { data, error } = await supabase
      .from("stock_tech")
      .select(`
        id,
        quantite,
        produit_id,
        produits (
          id,
          nom,
          reference,
          categorie
        )
      `)
      .eq("user_id", user.id)

    if (error) {
      console.log(error)
      return
    }

    setStocks(data || [])
  }

  // MODIFIER QUANTITE
  const modifierQuantite = async (
    item: any,
    valeur: number
  ) => {
    const nouvelleQuantite =
      item.quantite + valeur

    if (nouvelleQuantite < 0) {
      alert("Impossible")
      return
    }

    await supabase
      .from("stock_tech")
      .update({
        quantite: nouvelleQuantite,
      })
      .eq("id", item.id)

    fetchStock()
  }

  // DECONNEXION
  const logout = async () => {
    await supabase.auth.signOut()

    router.push("/")
  }

  useEffect(() => {
    fetchStock()
  }, [])

  return (
    <div style={{ padding: "20px" }}>
      <h1>Stock Technicien</h1>

      <button onClick={logout}>
        Déconnexion
      </button>

      <hr />

      <h2>
        Filtrer par catégorie
      </h2>

      <select
        value={selectedCategorie}
        onChange={(e) =>
          setSelectedCategorie(
            e.target.value
          )
        }
      >
        <option value="">
          Toutes catégories
        </option>

        {[...new Set(
          stocks.map(
            (s) =>
              s.produits?.categorie
          )
        )].map((cat, index) => (
          <option
            key={index}
            value={cat}
          >
            {cat}
          </option>
        ))}
      </select>

      <br />
      <br />

      {stocks
        .filter((item) => {
          if (!selectedCategorie)
            return true

          return (
            item.produits
              ?.categorie ===
            selectedCategorie
          )
        })
        .map((item, index) => (
          <div
            key={index}
            style={{
              border:
                "1px solid black",
              padding: "10px",
              marginBottom: "10px",
            }}
          >
            <h3>
              {item.produits?.nom}
            </h3>

            <p>
              Référence :
              {" "}
              {
                item.produits
                  ?.reference
              }
            </p>

            <p>
              Catégorie :
              {" "}
              {
                item.produits
                  ?.categorie
              }
            </p>

            <p>
              Quantité :
              {" "}
              {item.quantite}
            </p>

            <button
              onClick={() =>
                modifierQuantite(
                  item,
                  -1
                )
              }
            >
              -1
            </button>

            <button
              onClick={() =>
                modifierQuantite(
                  item,
                  -10
                )
              }
            >
              -10
            </button>
          </div>
        ))}
    </div>
  )
}