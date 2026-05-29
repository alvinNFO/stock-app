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

  const [demandes, setDemandes] =
    useState<any[]>([])

  const [quantitesDemandes, setQuantitesDemandes] =
    useState<any>({})

  const [nom, setNom] =
    useState("")

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

  const [search, setSearch] =
    useState("")

  const [selectedCategorie, setSelectedCategorie] =
    useState("")

  const [showStock, setShowStock] =
    useState(true)

  // FETCH
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
            reference,
            categorie,
            stock_minimum,
            fournisseur,
            lien_fournisseur
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

    // DEMANDES
    const { data: demandesData } =
      await supabase
        .from("demandes_stock")
        .select(`
          *,
          produits (
            nom
          ),
          techniciens (
            email
          )
        `)
        .eq("statut", "en_attente")

    setDemandes(demandesData || [])
  }

  useEffect(() => {
    fetchData()
  }, [])

  // AJOUT PRODUIT
  const ajouterProduit =
    async () => {
      if (
        !nom ||
        !reference
      ) {
        alert(
          "Remplir les champs"
        )
        return
      }

      const { data, error } =
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

      if (error) {
        alert(error.message)
        return
      }

      // CREER STOCK GENERAL
      await supabase
        .from(
          "stock_general"
        )
        .insert({
          produit_id: data.id,
          quantite: 0,
        })

      alert(
        "Produit ajouté"
      )

      setNom("")
      setReference("")
      setCategorie("")
      setStockMinimum(10)

      fetchData()
    }

  // MODIFIER STOCK
  const modifierStock =
    async (
      item: any,
      valeur: number
    ) => {
      const nouvelleQuantite =
        item.quantite +
        valeur

      if (
        nouvelleQuantite < 0
      ) {
        alert("Impossible")
        return
      }

      await supabase
        .from(
          "stock_general"
        )
        .update({
          quantite:
            nouvelleQuantite,
        })
        .eq("id", item.id)

      fetchData()
    }

  // MODIFIER CATEGORIE
  const modifierCategorie =
    async (
      produitId: number,
      nouvelleCategorie: string
    ) => {
      await supabase
        .from("produits")
        .update({
          categorie:
            nouvelleCategorie,
        })
        .eq("id", produitId)

      fetchData()
    }

  // ATTRIBUER MATERIEL
  const attribuerMateriel =
    async () => {
      if (
        !selectedUser ||
        !selectedProduit ||
        quantite <= 0
      ) {
        alert(
          "Champs invalides"
        )
        return
      }

      const stockGeneralItem =
        stockGeneral.find(
          (s: any) =>
            String(
              s.produit_id
            ) ===
            String(
              selectedProduit
            )
        )

      if (
        !stockGeneralItem
      ) {
        alert(
          "Produit absent"
        )
        return
      }

      if (
        stockGeneralItem.quantite <
        quantite
      ) {
        alert(
          "Stock insuffisant"
        )
        return
      }

      // STOCK TECH
      const {
        data: stockTech,
      } = await supabase
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
          .from(
            "stock_tech"
          )
          .update({
            quantite:
              stockTech.quantite +
              quantite,
          })
          .eq(
            "id",
            stockTech.id
          )
      } else {
        await supabase
          .from(
            "stock_tech"
          )
          .insert({
            user_id:
              selectedUser,
            produit_id:
              selectedProduit,
            quantite,
          })
      }

      // RETIRER STOCK GENERAL
      await supabase
        .from(
          "stock_general"
        )
        .update({
          quantite:
            stockGeneralItem.quantite -
            quantite,
        })
        .eq(
          "id",
          stockGeneralItem.id
        )

      alert(
        "Matériel attribué"
      )

      fetchData()
    }

  // ACCEPTER DEMANDE
  const accepterDemande =
    async (
      demande: any
    ) => {
      const quantiteAjout =
        Number(
          quantitesDemandes[
            demande.id
          ]
        ) || 0

      if (
        quantiteAjout <= 0
      ) {
        alert(
          "Quantité invalide"
        )
        return
      }

      // STOCK TECH
      const {
        data: stockTech,
      } = await supabase
        .from("stock_tech")
        .select("*")
        .eq(
          "user_id",
          demande.user_id
        )
        .eq(
          "produit_id",
          demande.produit_id
        )
        .single()

      if (stockTech) {
        await supabase
          .from(
            "stock_tech"
          )
          .update({
            quantite:
              stockTech.quantite +
              quantiteAjout,
          })
          .eq(
            "id",
            stockTech.id
          )
      } else {
        await supabase
          .from(
            "stock_tech"
          )
          .insert({
            user_id:
              demande.user_id,
            produit_id:
              demande.produit_id,
            quantite:
              quantiteAjout,
          })
      }

      // STOCK GENERAL
      const stockItem =
        stockGeneral.find(
          (s: any) =>
            s.produit_id ===
            demande.produit_id
        )

      await supabase
        .from(
          "stock_general"
        )
        .update({
          quantite:
            stockItem.quantite -
            quantiteAjout,
        })
        .eq(
          "id",
          stockItem.id
        )

      // SUPPRIMER DEMANDE
      await supabase
        .from(
          "demandes_stock"
        )
        .delete()
        .eq(
          "id",
          demande.id
        )

      alert(
        "Demande acceptée"
      )

      fetchData()
    }

  // CATEGORIES
  const categories = [
    ...new Set(
      produits.map(
        (p: any) =>
          p.categorie
      )
    ),
  ]

  // FILTRE
  const stockFiltre =
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
        placeholder="Stock minimum"
        value={
          stockMinimum
        }
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

      {/* DEMANDES */}

      <h2>
        Demandes en attente
      </h2>

      {demandes.map(
        (demande: any) => (
          <div
            key={demande.id}
            style={{
              border:
                "1px solid orange",
              padding: 10,
              marginBottom: 10,
            }}
          >
            <p>
              Technicien :
              {" "}
              {
                demande
                  .techniciens
                  ?.email
              }
            </p>

            <p>
              Produit :
              {" "}
              {
                demande
                  .produits
                  ?.nom
              }
            </p>

            <p>
              Stock actuel :
              {" "}
              {
                demande.quantite_actuelle
              }
            </p>

            <input
              type="number"
              placeholder="Quantité à donner"
              onChange={(e) =>
                setQuantitesDemandes(
                  {
                    ...quantitesDemandes,
                    [demande.id]:
                      e.target
                        .value,
                  }
                )
              }
            />

            <br />
            <br />

            <button
              onClick={() =>
                accepterDemande(
                  demande
                )
              }
            >
              Accepter
            </button>
          </div>
        )
      )}

      <hr />

      {/* GESTION STOCK */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
        }}
      >
        <h2>
          Gestion Stock
        </h2>

        <button
          onClick={() =>
            setShowStock(
              !showStock
            )
          }
        >
          {showStock
            ? "Réduire"
            : "Afficher"}
        </button>
      </div>

      {showStock && (
        <>
          {/* RECHERCHE */}

          <input
            placeholder="Recherche produit..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target
                  .value
              )
            }
            style={{
              padding: 10,
              width: 300,
            }}
          />

          <br />
          <br />

          {/* FILTRE CATEGORIE */}

          <select
            value={
              selectedCategorie
            }
            onChange={(e) =>
              setSelectedCategorie(
                e.target
                  .value
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
            (
              [cat, items]: any
            ) => (
              <div
                key={cat}
              >
                <h2
                  style={{
                    color:
                      "blue",
                  }}
                >
                  {cat}
                </h2>

                {items.map(
                  (
                    item: any
                  ) => (
                    <div
                      key={
                        item.id
                      }
                      style={{
                        border:
                          "1px solid blue",
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

                      <input
                        value={
                          item
                            .produits
                            ?.categorie ||
                          ""
                        }
                        onChange={(
                          e
                        ) =>
                          modifierCategorie(
                            item
                              .produits
                              .id,
                            e
                              .target
                              .value
                          )
                        }
                      />

                      <br />
                      <br />

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
        </>
      )}

      <hr />

      {/* ATTRIBUER */}

      <h2>
        Attribuer Matériel
      </h2>

      <select
        value={
          selectedUser
        }
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

        {produits.map(
          (
            produit: any
          ) => (
            <option
              key={
                produit.id
              }
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
    </div>
  )
}