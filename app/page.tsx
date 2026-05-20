"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const [stocks, setStocks] = useState<any[]>([])
  const [selectedCategorie, setSelectedCategorie] =
    useState("")

  const fetchStock = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert("Non connecté")
      return
    }

    const { data, error } = await supabase
      .from("stock_tech")
      .select(`
        id,
        quantite,
        produits (
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

  useEffect(() => {
    fetchStock()
  }, [])

  return (
    <div style={{ padding: "20px" }}>
      <h1>Stock Technicien</h1>

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
          </div>
        ))}
    </div>
  )
}