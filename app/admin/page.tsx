"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function AdminPage() {
  const [produits, setProduits] = useState<any[]>([])
  const [stockGeneral, setStockGeneral] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])

  const [stockTechnicien, setStockTechnicien] =
    useState<any[]>([])

  const [selectedTechStock, setSelectedTechStock] =
    useState("")

  const [selectedCategorie, setSelectedCategorie] =
    useState("")

  const [nom, setNom] = useState("")
  const [reference, setReference] = useState("")
  const [categorie, setCategorie] = useState("")
  const [stockMinimum, setStockMinimum] =
    useState(10)

  const [selectedUser, setSelectedUser] =
    useState("")

  const [selectedProduit, setSelectedProduit] =
    useState("")

  const [quantite, setQuantite] = useState(1)

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

    setUsers(usersData || [])
  }

  // AJOUT PRODUIT
  const ajouterProduit = async () => {
    if (!nom || !reference) {
      alert("Remplir les champs")
      return
    }

    const { data, error } =
      await supabase
        .from("produits")
        .insert({
          nom,
          reference,
          categorie,
          stock_minimum: stockMinimum,
        })
        .select()
        .single()

    if (error) {
      alert(error.message)
      return
    }

    // CREER STOCK GENERAL
    await supabase
      .from("stock_general")
      .insert({
        produit_id: data.id,
        quantite: 0,
      })

    alert("Produit ajouté")

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
      alert("Impossible")
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
          s.produit_id === selectedProduit
      )

    if (!stockGeneralItem) {
      alert("Produit absent")
      return
    }

    if (
      stockGeneralItem.quantite < quantite
    ) {
      alert("Stock insuffisant")
      return
    }

    // STOCK TECH EXISTANT
    const { data: stockTech } =
      await supabase
        .from("stock_tech")
        .select("*")
        .eq("user_id", selectedUser)
        .eq("produit_id", selectedProduit)
        .single()

    if (stockTech) {
      // UPDATE
      await supabase
        .from("stock_tech")
        .update({
          quantite:
            stockTech.quantite + quantite,
        })
        .eq("id", stockTech.id)
    } else {
      // INSERT
      await supabase
        .from("stock_tech")
        .insert({
          user_id: selectedUser,
          produit_id: selectedProduit,
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
  const voirStockTechnicien = async (
    userId: string
  ) => {
    setSelectedTechStock(userId)

    const { data } = await supabase
      .from("stock_tech")
      .select(`
        id,
        quantite,
        produits (
          nom,
          reference
        )
      `)
      .eq("user_id", userId)

    setStockTechnicien(data || [])
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div style={{ padding: "20px" }}>
      <h1>ADMIN</h1>

      <hr />

      <h2>Ajouter Produit</h2>

      <input
        placeholder="Nom"
        value={nom}
        onChange={(e) =>
          setNom(e.target.value)
        }
      />

      <br />
      <br />

      <input
        placeholder="Référence"
        value={reference}
        onChange={(e) =>
          setReference(e.target.value)
        }
      />

      <br />
      <br />

      <input
        placeholder="Catégorie"
        value={categorie}
        onChange={(e) =>
          setCategorie(e.target.value)
        }
      />

      <br />
      <br />

      <input
        type="number"
        placeholder="Stock minimum"
        value={stockMinimum}
        onChange={(e) =>
          setStockMinimum(
            Number(e.target.value)
          )
        }
      />

      <br />
      <br />

      <button onClick={ajouterProduit}>
        Ajouter Produit
      </button>

      <hr />

      <h2>Filtrer par catégorie</h2>

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
          produits.map(
            (p) => p.categorie
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

      <h2>Gestion Stock Général</h2>

      {stockGeneral
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
              border: "1px solid blue",
              padding: "10px",
              marginBottom: "10px",
            }}
          >
            <h3>
              {item.produits?.nom}
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
              Stock :
              {" "}
              {item.quantite}
            </p>

            {item.quantite <=
              item.produits
                ?.stock_minimum && (
              <div>
                <p
                  style={{
                    color: "red",
                  }}
                >
                  ⚠️ Stock faible
                </p>

                <a
                  href={
                    item.produits
                      ?.lien_fournisseur
                  }
                  target="_blank"
                >
                  <button>
                    Commander chez{" "}
                    {
                      item.produits
                        ?.fournisseur
                    }
                  </button>
                </a>
              </div>
            )}

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
        ))}

      <hr />

      <h2>Attribuer Matériel</h2>

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

        {users.map((user) => (
          <option
            key={user.id}
            value={user.id}
          >
            {user.email}
          </option>
        ))}
      </select>

      <br />
      <br />

      <select
        value={selectedProduit}
        onChange={(e) =>
          setSelectedProduit(
            e.target.value
          )
        }
      >
        <option value="">
          Choisir produit
        </option>

        {produits.map((produit) => (
          <option
            key={produit.id}
            value={produit.id}
          >
            {produit.nom}
          </option>
        ))}
      </select>

      <br />
      <br />

      <input
        type="number"
        value={quantite}
        onChange={(e) =>
          setQuantite(
            Number(e.target.value)
          )
        }
      />

      <br />
      <br />

      <button onClick={attribuerMateriel}>
        Attribuer
      </button>

      <hr />

      <h2>
        Voir Stock Technicien
      </h2>

      <select
        value={selectedTechStock}
        onChange={(e) =>
          voirStockTechnicien(
            e.target.value
          )
        }
      >
        <option value="">
          Choisir technicien
        </option>

        {users.map((user) => (
          <option
            key={user.id}
            value={user.id}
          >
            {user.email}
          </option>
        ))}
      </select>

      <br />
      <br />

      {stockTechnicien.map(
        (item, index) => (
          <div
            key={index}
            style={{
              border:
                "1px solid gray",
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
              Quantité :
              {" "}
              {item.quantite}
            </p>
          </div>
        )
      )}
    </div>
  )
}