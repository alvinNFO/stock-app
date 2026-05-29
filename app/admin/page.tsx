"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function AdminPage() {
  const [produits, setProduits] =
    useState<any[]>([])

  const [stockGeneral, setStockGeneral] =
    useState<any[]>([])

  const [users, setUsers] =
    useState<any[]>([])

  const [demandes, setDemandes] =
    useState<any[]>([])

  const [stockTechnicien, setStockTechnicien] =
    useState<any[]>([])

  const [selectedTechStock, setSelectedTechStock] =
    useState("")

  const [nom, setNom] = useState("")
  const [reference, setReference] =
    useState("")

  const [categorie, setCategorie] =
    useState("")

  const [stockMinimum, setStockMinimum] =
    useState(10)

  const [selectedUser, setSelectedUser] =
    useState("")

  const [selectedProduit, setSelectedProduit] =
    useState("")

  const [quantite, setQuantite] =
    useState(1)

  const [quantitesDemandes, setQuantitesDemandes] =
    useState<any>({})

  const [search, setSearch] =
    useState("")

  const [searchCategorie, setSearchCategorie] =
    useState("")

  // FETCH DATA
  const fetchData = async () => {
    // PRODUITS
    const { data: produitsData } =
      await supabase
        .from("produits")
        .select("*")

    setProduits(produitsData || [])

    // STOCK GENERAL
    const { data: stockData } =
      await supabase
        .from("stock_general")
        .select(`
          id,
          quantite,
          produit_id,
          produits (
            id,
            nom,
            reference,
            categorie,
            stock_minimum
          )
        `)

    setStockGeneral(stockData || [])

    // TECHNICIENS
    const { data: usersData } =
      await supabase
        .from("techniciens")
        .select("*")

    setUsers(usersData || [])

    // DEMANDES
    const { data: demandesData } =
      await supabase
        .from("demandes_stock")
        .select(`
          *,
          produits (
            nom
          )
        `)

    setDemandes(
      (demandesData || []).filter(
        (d: any) =>
          d.status !== "validee"
      )
    )
  }

  useEffect(() => {
    fetchData()
  }, [])

  // VOIR STOCK TECHNICIEN
  const voirStockTechnicien = async (
    userId: string
  ) => {
    setSelectedTechStock(userId)

    const { data } =
      await supabase
        .from("stock_tech")
        .select(`
          *,
          produits (
            nom,
            categorie
          )
        `)
        .eq("user_id", userId)

    setStockTechnicien(data || [])
  }

  // MODIFIER STOCK
  const modifierStock = async (
    item: any,
    valeur: number
  ) => {
    const nouvelleQuantite =
      item.quantite + valeur

    if (nouvelleQuantite < 0) {
      return
    }

    await supabase
      .from("stock_general")
      .update({
        quantite: nouvelleQuantite,
      })
      .eq("id", item.id)

    fetchData()
  }

  // AJOUT PRODUIT
  const ajouterProduit = async () => {
    if (!nom || !reference) {
      return
    }

    const { data } =
      await supabase
        .from("produits")
        .insert({
          nom,
          reference,
          categorie,
          stock_minimum:
            stockMinimum,
        })
        .select()
        .single()

    await supabase
      .from("stock_general")
      .insert({
        produit_id: data.id,
        quantite: 0,
      })

    setNom("")
    setReference("")
    setCategorie("")
    setStockMinimum(10)

    fetchData()
  }

  // GROUPE PAR CATEGORIE
  const groupedStock =
    stockGeneral.reduce(
      (acc: any, item: any) => {
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

  // FILTRE
  const filteredGroupedStock =
    Object.entries(groupedStock).reduce(
      (
        acc: any,
        [cat, items]: any
      ) => {
        // FILTRE CATEGORIE
        if (
          !cat
            .toLowerCase()
            .includes(
              searchCategorie.toLowerCase()
            )
        ) {
          return acc
        }

        // FILTRE PRODUIT
        const filtered =
          items.filter(
            (item: any) =>
              item.produits?.nom
                ?.toLowerCase()
                .includes(
                  search.toLowerCase()
                )
          )

        if (filtered.length > 0) {
          acc[cat] = filtered
        }

        return acc
      },
      {}
    )

  return (
    <div style={{ padding: 20 }}>
      <h1>ADMIN</h1>

      <hr />

      {/* AJOUT PRODUIT */}

      <h2>Ajouter produit</h2>

      <input
        placeholder="Nom"
        value={nom}
        onChange={(e) =>
          setNom(
            e.target.value
          )
        }
      />

      <br />
      <br />

      <input
        placeholder="Référence"
        value={reference}
        onChange={(e) =>
          setReference(
            e.target.value
          )
        }
      />

      <br />
      <br />

      <input
        placeholder="Catégorie"
        value={categorie}
        onChange={(e) =>
          setCategorie(
            e.target.value
          )
        }
      />

      <br />
      <br />

      <input
        type="number"
        value={stockMinimum}
        onChange={(e) =>
          setStockMinimum(
            Number(
              e.target.value
            )
          )
        }
      />

      <br />
      <br />

      <button
        onClick={ajouterProduit}
      >
        Ajouter
      </button>

      <hr />

      {/* GESTION STOCK */}

      <h2>
        Gestion des stocks
      </h2>

      <input
        placeholder="Rechercher produit..."
        value={search}
        onChange={(e) =>
          setSearch(
            e.target.value
          )
        }
        style={{
          padding: "10px",
          width: "300px",
          marginBottom: "10px",
        }}
      />

      <br />

      <input
        placeholder="Rechercher catégorie..."
        value={
          searchCategorie
        }
        onChange={(e) =>
          setSearchCategorie(
            e.target.value
          )
        }
        style={{
          padding: "10px",
          width: "300px",
          marginBottom: "20px",
        }}
      />

      <hr />

      {/* STOCKS */}

      {Object.entries(
        filteredGroupedStock
      ).map(
        ([cat, items]: any) => (
          <div
            key={cat}
            style={{
              marginBottom: 30,
            }}
          >
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

                  <button
                    onClick={() =>
                      modifierStock(
                        item,
                        1
                      )
                    }
                  >
                    +1
                  </button>

                  <button
                    onClick={() =>
                      modifierStock(
                        item,
                        10
                      )
                    }
                  >
                    +10
                  </button>

                  <button
                    onClick={() =>
                      modifierStock(
                        item,
                        -1
                      )
                    }
                  >
                    -1
                  </button>

                  <button
                    onClick={() =>
                      modifierStock(
                        item,
                        -10
                      )
                    }
                  >
                    -10
                  </button>
                </div>
              )
            )}
          </div>
        )
      )}

      <hr />

      {/* STOCK TECHNICIEN */}

      <h2>
        Stock technicien
      </h2>

      <select
        value={
          selectedTechStock
        }
        onChange={(e) =>
          voirStockTechnicien(
            e.target.value
          )
        }
      >
        <option value="">
          Choisir technicien
        </option>

        {users.map(
          (user: any) => (
            <option
              key={user.id}
              value={user.id}
            >
              {user.email}
            </option>
          )
        )}
      </select>

      <br />
      <br />

      {stockTechnicien.map(
        (item: any) => (
          <div
            key={item.id}
            style={{
              border:
                "1px solid green",
              padding: 10,
              marginBottom: 10,
            }}
          >
            <h3>
              {
                item.produits
                  ?.nom
              }
            </h3>

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
          </div>
        )
      )}
    </div>
  )
}