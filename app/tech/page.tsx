"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function TechnicienPage() {
  const [user, setUser] =
    useState<any>(null)

  const [stock, setStock] =
    useState<any[]>([])

  const [produits, setProduits] =
    useState<any[]>([])

  const [selectedCategorie, setSelectedCategorie] =
    useState("")

  const [search, setSearch] =
    useState("")

  // PRODUITS UTILISES
  const [utilisation, setUtilisation] =
    useState<any>({})

  // FETCH
  const fetchData = async () => {
    // USER CONNECTE
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    setUser(user)

    // PRODUITS
    const { data: produitsData } =
      await supabase
        .from("produits")
        .select("*")

    setProduits(produitsData || [])

    // STOCK TECH
    const { data: stockData } =
      await supabase
        .from("stock_tech")
        .select(`
          *,
          produits (
            id,
            nom,
            categorie,
            stock_minimum
          )
        `)
        .eq("user_id", user.id)

    setStock(stockData || [])
  }

  useEffect(() => {
    fetchData()
  }, [])

  // DECONNEXION
  const logout = async () => {
    await supabase.auth.signOut()

    window.location.href =
      "/login"
  }

  // AJOUTER UTILISATION
  const ajouterUtilisation = (
    stockId: number
  ) => {
    setUtilisation({
      ...utilisation,
      [stockId]:
        (utilisation[stockId] || 0) +
        1,
    })
  }

  // RETIRER UTILISATION
  const retirerUtilisation = (
    stockId: number
  ) => {
    if (
      (utilisation[stockId] || 0) <= 0
    )
      return

    setUtilisation({
      ...utilisation,
      [stockId]:
        utilisation[stockId] - 1,
    })
  }

  // CONFIRMER UTILISATION
  const confirmerUtilisation =
    async () => {
      for (const item of stock) {
        const quantiteUtilisee =
          utilisation[item.id] || 0

        if (
          quantiteUtilisee <= 0
        )
          continue

        const nouveauStock =
          item.quantite -
          quantiteUtilisee

        // UPDATE STOCK TECH
        await supabase
          .from("stock_tech")
          .update({
            quantite:
              nouveauStock,
          })
          .eq("id", item.id)

        // SI STOCK MINIMUM
        if (
          nouveauStock <=
          item.produits
            ?.stock_minimum
        ) {
          // VERIFIER DEMANDE EXISTANTE
          const {
            data:
              demandeExistante,
          } = await supabase
            .from(
              "demandes_stock"
            )
            .select("*")
            .eq(
              "user_id",
              user.id
            )
            .eq(
              "produit_id",
              item.produit_id
            )
            .eq(
              "statut",
              "en_attente"
            )
            .single()

          // CREER DEMANDE
          if (
            !demandeExistante
          ) {
            await supabase
              .from(
                "demandes_stock"
              )
              .insert({
                user_id:
                  user.id,
                produit_id:
                  item.produit_id,
                quantite_actuelle:
                  nouveauStock,
              })
          }
        }
      }

      alert(
        "Stock mis à jour"
      )

      setUtilisation({})

      fetchData()
    }

  // CATEGORIES
  const categories = [
    ...new Set(
      stock.map(
        (item: any) =>
          item.produits
            ?.categorie
      )
    ),
  ]

  // FILTRE
  const stockFiltre =
    stock.filter(
      (item: any) => {
        const matchSearch =
          item.produits?.nom
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            )

        const matchCategorie =
          selectedCategorie ===
            "" ||
          item.produits
            ?.categorie ===
            selectedCategorie

        return (
          matchSearch &&
          matchCategorie
        )
      }
    )

  // GROUPER
  const stockGroupe =
    stockFiltre.reduce(
      (
        acc: any,
        item: any
      ) => {
        const cat =
          item.produits
            ?.categorie ||
          "Sans catégorie"

        if (!acc[cat]) {
          acc[cat] = []
        }

        acc[cat].push(item)

        return acc
      },
      {}
    )

  return (
    <div
      style={{
        padding: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
        }}
      >
        <h1>
          Stock Technicien
        </h1>

        <button
          onClick={logout}
        >
          Déconnexion
        </button>
      </div>

      <hr />

      {/* RECHERCHE */}

      <input
        placeholder="Recherche produit..."
        value={search}
        onChange={(e) =>
          setSearch(
            e.target.value
          )
        }
        style={{
          padding: 10,
          width: 300,
        }}
      />

      <br />
      <br />

      {/* CATEGORIES */}

      <select
        value={
          selectedCategorie
        }
        onChange={(e) =>
          setSelectedCategorie(
            e.target.value
          )
        }
      >
        <option value="">
          Toutes catégories
        </option>

        {categories.map(
          (
            cat: any,
            index
          ) => (
            <option
              key={index}
              value={cat}
            >
              {cat}
            </option>
          )
        )}
      </select>

      <hr />

      {/* STOCK */}

      {Object.entries(
        stockGroupe
      ).map(
        ([cat, items]: any) => (
          <div key={cat}>
            <h2
              style={{
                color: "blue",
              }}
            >
              {cat}
            </h2>

            {items.map(
              (item: any) => (
                <div
                  key={item.id}
                  style={{
                    border:
                      "1px solid #ccc",
                    padding: 10,
                    marginBottom: 10,
                  }}
                >
                  <h3>
                    {
                      item
                        .produits
                        ?.nom
                    }
                  </h3>

                  <p>
                    Stock :
                    {" "}
                    {
                      item.quantite
                    }
                  </p>

                  <p>
                    Utilisé :
                    {" "}
                    {utilisation[
                      item.id
                    ] || 0}
                  </p>

                  <button
                    onClick={() =>
                      ajouterUtilisation(
                        item.id
                      )
                    }
                  >
                    +1 utilisé
                  </button>

                  <button
                    onClick={() =>
                      retirerUtilisation(
                        item.id
                      )
                    }
                  >
                    -1
                  </button>
                </div>
              )
            )}
          </div>
        )
      )}

      <hr />

      <button
        onClick={
          confirmerUtilisation
        }
        style={{
          padding: 15,
          fontSize: 18,
        }}
      >
        Confirmer utilisation
      </button>
    </div>
  )
}