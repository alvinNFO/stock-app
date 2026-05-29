"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function AdminPage() {
  // STATES
  const [produits, setProduits] =
    useState<any[]>([])

  const [stockGeneral, setStockGeneral] =
    useState<any[]>([])

  const [users, setUsers] =
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

  // RECHERCHE STOCK
  const [search, setSearch] =
    useState("")

  const [selectedCategorie, setSelectedCategorie] =
    useState("")

  // RECHERCHE ATTRIBUTION
  const [searchProduit, setSearchProduit] =
    useState("")

  const [
    categorieProduit,
    setCategorieProduit,
  ] = useState("")

  // FETCH DATA
  const fetchData = async () => {
    // PRODUITS
    const { data: produitsData } =
      await supabase
        .from("produits")
        .select("*")
        .order("nom")

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
        .order("email")

    setUsers(usersData || [])
  }

  useEffect(() => {
    fetchData()
  }, [])

  // AJOUT PRODUIT
  const ajouterProduit = async () => {
    if (!nom || !reference) {
      alert("Champs manquants")
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

  // ATTRIBUER MATERIEL
  const attribuerMateriel = async () => {
    if (
      !selectedUser ||
      !selectedProduit ||
      quantite <= 0
    ) {
      alert("Champs invalides")
      return
    }

    const stockGeneralItem =
      stockGeneral.find(
        (s) =>
          s.produit_id ==
          selectedProduit
      )

    if (!stockGeneralItem) {
      alert("Produit absent")
      return
    }

    if (
      stockGeneralItem.quantite <
      quantite
    ) {
      alert("Stock insuffisant")
      return
    }

    // VERIFIER STOCK TECH
    const { data: stockTech } =
      await supabase
        .from("stock_tech")
        .select("*")
        .eq(
          "user_id",
          selectedUser
        )
        .eq(
          "produit_id",
          selectedProduit
        )
        .single()

    if (stockTech) {
      await supabase
        .from("stock_tech")
        .update({
          quantite:
            stockTech.quantite +
            quantite,
        })
        .eq("id", stockTech.id)
    } else {
      await supabase
        .from("stock_tech")
        .insert({
          user_id: selectedUser,
          produit_id:
            selectedProduit,
          quantite,
        })
    }

    // RETIRER STOCK GENERAL
    await supabase
      .from("stock_general")
      .update({
        quantite:
          stockGeneralItem.quantite -
          quantite,
      })
      .eq("id", stockGeneralItem.id)

    alert("Matériel attribué")

    fetchData()
  }

  // VOIR STOCK TECHNICIEN
  const voirStockTechnicien =
    async (userId: string) => {
      setSelectedTechStock(
        userId
      )

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

      setStockTechnicien(
        data || []
      )
    }

  // CATEGORIES STOCK
  const categories = [
    ...new Set(
      stockGeneral.map(
        (item: any) =>
          item.produits
            ?.categorie
      )
    ),
  ]

  // FILTRE STOCK
  const filteredStock =
    stockGeneral.filter(
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

  // GROUPER STOCK
  const groupedStock =
    filteredStock.reduce(
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

  // CATEGORIES ATTRIBUTION
  const categoriesProduits = [
    ...new Set(
      produits.map(
        (p: any) =>
          p.categorie
      )
    ),
  ]

  // PRODUITS FILTRES
  const produitsFiltres =
    produits.filter(
      (produit: any) => {
        const matchSearch =
          produit.nom
            ?.toLowerCase()
            .includes(
              searchProduit.toLowerCase()
            )

        const matchCategorie =
          categorieProduit ===
            "" ||
          produit.categorie ===
            categorieProduit

        return (
          matchSearch &&
          matchCategorie
        )
      }
    )

  return (
    <div style={{ padding: 20 }}>
      <h1>ADMIN</h1>

      <hr />

      {/* AJOUT PRODUIT */}

      <h2>
        Ajouter Produit
      </h2>

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
        onClick={
          ajouterProduit
        }
      >
        Ajouter Produit
      </button>

      <hr />

      {/* GESTION STOCK */}

      <h2>
        Gestion des stocks
      </h2>

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

      {Object.entries(
        groupedStock
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

      {/* ATTRIBUER */}

      <h2>
        Attribuer matériel
      </h2>

      <select
        value={selectedUser}
        onChange={(e) =>
          setSelectedUser(
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

      <input
        placeholder="Rechercher produit..."
        value={searchProduit}
        onChange={(e) =>
          setSearchProduit(
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
          categorieProduit
        }
        onChange={(e) =>
          setCategorieProduit(
            e.target.value
          )
        }
      >
        <option value="">
          Toutes catégories
        </option>

        {categoriesProduits.map(
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

      <br />
      <br />

      <select
        value={
          selectedProduit
        }
        onChange={(e) =>
          setSelectedProduit(
            e.target.value
          )
        }
      >
        <option value="">
          Choisir produit
        </option>

        {produitsFiltres.map(
          (
            produit: any
          ) => (
            <option
              key={produit.id}
              value={
                produit.id
              }
            >
              {produit.nom}
            </option>
          )
        )}
      </select>

      <br />
      <br />

      <input
        type="number"
        value={quantite}
        onChange={(e) =>
          setQuantite(
            Number(
              e.target.value
            )
          )
        }
      />

      <br />
      <br />

      <button
        onClick={
          attribuerMateriel
        }
      >
        Attribuer
      </button>

      <hr />

      {/* STOCK TECH */}

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