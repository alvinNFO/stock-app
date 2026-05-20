"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function AdminPage() {
  const [produits, setProduits] = useState<any[]>([])
  const [stockGeneral, setStockGeneral] =
    useState<any[]>([])

  const [users, setUsers] = useState<any[]>([])

  const [demandes, setDemandes] =
    useState<any[]>([])

  const [showStocks, setShowStocks] =
    useState(true)

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

  const [quantite, setQuantite] = useState(1)

  const [quantitesDemandes, setQuantitesDemandes] =
    useState<any>({})

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

    const demandesEnAttente =
      (demandesData || []).filter(
        (d: any) =>
          d.status !== "validee"
      )

    setDemandes(demandesEnAttente)
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

    const { data: stockTech } =
      await supabase
        .from("stock_tech")
        .select("*")
        .eq("user_id", selectedUser)
        .eq("produit_id", selectedProduit)
        .single()

    if (stockTech) {
      await supabase
        .from("stock_tech")
        .update({
          quantite:
            stockTech.quantite + quantite,
        })
        .eq("id", stockTech.id)
    } else {
      await supabase
        .from("stock_tech")
        .insert({
          user_id: selectedUser,
          produit_id: selectedProduit,
          quantite,
        })
    }

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

  // ACCEPTER DEMANDE
  const accepterDemande = async (
    demande: any
  ) => {
    const quantiteAEnvoyer =
      Number(
        quantitesDemandes[
          demande.id
        ]
      ) || 0

    if (quantiteAEnvoyer <= 0) {
      alert("Quantité invalide")
      return
    }

    const stockGeneralItem =
      stockGeneral.find(
        (s) =>
          s.produit_id ===
          demande.produit_id
      )

    if (!stockGeneralItem) {
      alert("Produit absent")
      return
    }

    if (
      stockGeneralItem.quantite <
      quantiteAEnvoyer
    ) {
      alert("Stock insuffisant")
      return
    }

    // STOCK TECH
    const { data: stockTech } =
      await supabase
        .from("stock_tech")
        .select("*")
        .eq("user_id", demande.user_id)
        .eq(
          "produit_id",
          demande.produit_id
        )
        .single()

    if (stockTech) {
      await supabase
        .from("stock_tech")
        .update({
          quantite:
            stockTech.quantite +
            quantiteAEnvoyer,
        })
        .eq("id", stockTech.id)
    } else {
      await supabase
        .from("stock_tech")
        .insert({
          user_id: demande.user_id,
          produit_id:
            demande.produit_id,
          quantite:
            quantiteAEnvoyer,
        })
    }

    // RETIRER STOCK GENERAL
    await supabase
      .from("stock_general")
      .update({
        quantite:
          stockGeneralItem.quantite -
          quantiteAEnvoyer,
      })
      .eq("id", stockGeneralItem.id)

    // VALIDER DEMANDE
    await supabase
      .from("demandes_stock")
      .update({
        status: "validee",
      })
      .eq("id", demande.id)

    alert("Demande acceptée")

    fetchData()
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

      <button
        onClick={() =>
          setShowStocks(!showStocks)
        }
      >
        {showStocks
          ? "Réduire Gestion Stock"
          : "Afficher Gestion Stock"}
      </button>

      {showStocks && (
        <div>
          <h2>
            Gestion Stock Général
          </h2>

          {stockGeneral.map(
            (item, index) => (
              <div
                key={index}
                style={{
                  border:
                    "1px solid blue",
                  padding: "10px",
                  marginBottom:
                    "10px",
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
                  Stock :
                  {" "}
                  {item.quantite}
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
      )}

      <hr />

      <h2>
        Demandes en attente
      </h2>

      {demandes.map(
        (demande, index) => (
          <div
            key={index}
            style={{
              border:
                "1px solid red",
              padding: "10px",
              marginBottom: "10px",
            }}
          >
            <h3>
              {
                demande.produits
                  ?.nom
              }
            </h3>

            <p>
              Quantité demandée :
              {" "}
              {
                demande.quantite_demandee
              }
            </p>

            <input
              type="number"
              placeholder="Quantité à donner"
              value={
                quantitesDemandes[
                  demande.id
                ] || ""
              }
              onChange={(e) =>
                setQuantitesDemandes({
                  ...quantitesDemandes,
                  [demande.id]:
                    e.target.value,
                })
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
              Accepter demande
            </button>
          </div>
        )
      )}

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
    </div>
  )
}