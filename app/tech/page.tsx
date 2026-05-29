"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function TechnicienPage() {
  const [stock, setStock] =
    useState<any[]>([])

  const [user, setUser] =
    useState<any>(null)

  const [search, setSearch] =
    useState("")

  const [selectedCategorie, setSelectedCategorie] =
    useState("")

  const [utilisations, setUtilisations] =
    useState<any[]>([])

  // FETCH STOCK
  const fetchStock =
    async () => {
      const {
        data: sessionData,
      } =
        await supabase.auth.getUser()

      const currentUser =
        sessionData?.user

      if (!currentUser) {
        return
      }

      setUser(currentUser)

      const { data } =
        await supabase
          .from("stock_tech")
          .select(`
          *,
          produits (
            nom,
            categorie,
            stock_minimum
          )
        `)
          .eq(
            "user_id",
            currentUser.id
          )

      setStock(data || [])
    }

  useEffect(() => {
    fetchStock()
  }, [])

  // AJOUTER UTILISATION
  const ajouterUtilisation = (
    item: any
  ) => {
    const existing =
      utilisations.find(
        (u) => u.id === item.id
      )

    if (existing) {
      setUtilisations(
        utilisations.map((u) =>
          u.id === item.id
            ? {
                ...u,
                quantite:
                  u.quantite + 1,
              }
            : u
        )
      )
    } else {
      setUtilisations([
        ...utilisations,
        {
          id: item.id,
          produit_id:
            item.produit_id,
          nom:
            item.produits?.nom,
          quantite: 1,
        },
      ])
    }
  }

  // RETIRER UTILISATION
  const retirerUtilisation = (
    item: any
  ) => {
    const existing =
      utilisations.find(
        (u) => u.id === item.id
      )

    if (!existing) return

    if (existing.quantite <= 1) {
      setUtilisations(
        utilisations.filter(
          (u) => u.id !== item.id
        )
      )
    } else {
      setUtilisations(
        utilisations.map((u) =>
          u.id === item.id
            ? {
                ...u,
                quantite:
                  u.quantite - 1,
              }
            : u
        )
      )
    }
  }

  // CONFIRMER UTILISATIONS
  const confirmerUtilisations =
    async () => {
      for (const item of utilisations) {
        const stockItem =
          stock.find(
            (s) =>
              s.id === item.id
          )

        if (!stockItem)
          continue

        const nouvelleQuantite =
          stockItem.quantite -
          item.quantite

        if (
          nouvelleQuantite < 0
        ) {
          continue
        }

        // UPDATE STOCK TECH
        await supabase
          .from("stock_tech")
          .update({
            quantite:
              nouvelleQuantite,
          })
          .eq(
            "id",
            stockItem.id
          )

        // DEMANDE SI STOCK FAIBLE
        if (
          nouvelleQuantite <=
          stockItem.produits
            ?.stock_minimum
        ) {
          // VERIFIER SI EXISTE
          const {
            data:
              existingDemande,
          } =
            await supabase
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
                stockItem.produit_id
              )
              .eq(
                "status",
                "en_attente"
              )
              .single()

          if (
            !existingDemande
          ) {
            await supabase
              .from(
                "demandes_stock"
              )
              .insert({
                user_id:
                  user.id,
                produit_id:
                  stockItem.produit_id,
                quantite:
                  stockItem
                    .produits
                    ?.stock_minimum,
                status:
                  "en_attente",
              })
          }
        }
      }

      alert(
        "Utilisations enregistrées"
      )

      setUtilisations([])

      fetchStock()
    }

  // DECONNEXION
  const logout = async () => {
    await supabase.auth.signOut()

    window.location.href =
      "/login"
  }

  // CATEGORIES UNIQUES
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
  const filteredStock =
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

  return (
    <div
      style={{
        padding: 20,
      }}
    >
      <h1>
        Stock technicien
      </h1>

      <button
        onClick={logout}
      >
        Déconnexion
      </button>

      <hr />

      {/* RECHERCHE */}

      <input
        placeholder="Rechercher produit..."
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

      {filteredStock.map(
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
            <h2>
              {
                item.produits
                  ?.nom
              }
            </h2>

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
              {
                item.quantite
              }
            </p>

            <button
              onClick={() =>
                ajouterUtilisation(
                  item
                )
              }
            >
              +
            </button>

            <button
              onClick={() =>
                retirerUtilisation(
                  item
                )
              }
            >
              -
            </button>
          </div>
        )
      )}

      <hr />

      {/* UTILISATIONS */}

      <h2>
        Produits utilisés
      </h2>

      {utilisations.map(
        (
          item: any,
          index
        ) => (
          <div
            key={index}
            style={{
              border:
                "1px solid orange",
              padding: 10,
              marginBottom: 10,
            }}
          >
            <h3>{item.nom}</h3>

            <p>
              Quantité utilisée :
              {" "}
              {
                item.quantite
              }
            </p>
          </div>
        )
      )}

      {utilisations.length >
        0 && (
        <button
          onClick={
            confirmerUtilisations
          }
          style={{
            padding:
              "10px 20px",
          }}
        >
          Confirmer les utilisations
        </button>
      )}
    </div>
  )
}