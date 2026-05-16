import { useEffect, useRef, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { supabase } from "./supabase";
import logo from "../src/assets/Atithi Logo.png";
import "./App.css";

function App() {

  const receiptRef = useRef();

  const [page, setPage] = useState("billing");

  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [bills, setBills] = useState([]);

  const [selectedBill, setSelectedBill] =
    useState(null);

  const [itemName, setItemName] =
    useState("");

  const [rate, setRate] =
    useState("");

  const [qty, setQty] =
    useState(1);

  const [reportType, setReportType] =
    useState("daily");

  const [taxName, setTaxName] = useState(
    localStorage.getItem("taxName") || "HST"
  );

  const [taxRate, setTaxRate] = useState(
    Number(localStorage.getItem("taxRate")) || 13
  );

  // LOAD DATA

  useEffect(() => {

    fetchMenuItems();

    const savedBills =
      JSON.parse(
        localStorage.getItem("bills")
      ) || [];

    setBills(savedBills);

  }, []);

  // FETCH MENU ITEMS

  const fetchMenuItems = async () => {

    try {

      const { data, error } =
        await supabase
          .from("menu")
          .select("*");

      if (error) {
        console.log(error);
        return;
      }

      let allItems = [];

      if (data && data.length > 0) {

        data.forEach((section) => {

          if (
            section.items &&
            Array.isArray(section.items)
          ) {

            section.items.forEach((item) => {

              if (
                item?.name &&
                item?.price
              ) {

                allItems.push({

                  id:
                    item.name +
                    Math.random(),

                  name:
                    item.name,

                  rate:
                    Number(item.price),

                });

              }

            });

          }

        });

      }

      setProducts(allItems);

    } catch (err) {

      console.log(err);

    }

  };

  // SAVE LOCAL STORAGE

  useEffect(() => {

    localStorage.setItem(
      "bills",
      JSON.stringify(bills)
    );

  }, [bills]);

  // SAVE TAX

  useEffect(() => {

    localStorage.setItem(
      "taxName",
      taxName
    );

    localStorage.setItem(
      "taxRate",
      taxRate
    );

  }, [taxName, taxRate]);

  // ADD ITEM

  const addItem = () => {

    if (!itemName || !qty) {

      alert("Fill all fields");

      return;

    }

    const newItem = {

      itemName,

      rate,

      qty,

      total: rate * qty,

    };

    setItems([
      ...items,
      newItem,
    ]);

    setItemName("");
    setRate("");
    setQty(1);

  };

  // REMOVE ITEM

  const removeItem = (index) => {

    if (
      !window.confirm(
        "Delete item?"
      )
    )
      return;

    const updated =
      items.filter(
        (_, i) => i !== index
      );

    setItems(updated);

  };

  // TOTALS

  const subtotal = items.reduce(
    (sum, item) =>
      sum + item.total,
    0
  );

  const tax =
    subtotal *
    (Number(taxRate) / 100);

  const total =
    subtotal + tax;

  // SAVE BILL

  const saveBill = () => {

    if (items.length === 0) {

      alert("Add items first");

      return;

    }

    const bill = {

      id: Date.now(),

      billNo:
        "BILL-" + Date.now(),

      date:
        new Date().toLocaleString(),

      items,

      subtotal,

      tax,

      total,

      taxName,

      taxRate,

    };

    // SAVE HISTORY

    const updatedBills = [
      bill,
      ...bills,
    ];

    setBills(updatedBills);

    // SHOW RECENT BILL

    setSelectedBill(bill);

    // CLEAR BILLING TABLE

    setItems([]);

    setItemName("");

    setRate("");

    setQty(1);

  };

  // PRINT BILL

  const printBill = () => {

    const printContents =
      receiptRef.current.innerHTML;

    const printWindow =
      window.open(
        "",
        "",
        "width=320,height=700"
      );

    printWindow.document.write(`

      <html>

        <head>

          

          <style>

            @page {
              size: 80mm auto;
              margin: 0;
            }

            body {

              width: 80mm;

              margin: 0;

              padding: 10px;

              font-family: Arial;

              background: #fff;

              color: #000;

            }

            .receipt-header{
              text-align:center;
            }

            .receipt-logo{
              width:70px;
              margin-bottom:8px;
            }

            h2{
              margin:0;
              font-size:22px;
            }

            h4{
              margin:4px 0;
              font-size:14px;
            }

            p{
              margin:3px 0;
              font-size:12px;
            }

            hr{
              border:none;
              border-top:1px dashed #000;
              margin:10px 0;
            }

            .receipt-table{
              width:100%;
              border-collapse:collapse;
            }

            .receipt-table td{
              padding:5px 0;
              font-size:12px;
            }

            .receipt-summary{
              margin-top:10px;
            }

            .receipt-summary p,
            .receipt-summary h3{
              display:flex;
              justify-content:space-between;
            }

            .thanks{
              text-align:center;
              margin-top:15px;
              font-weight:bold;
            }

          </style>

        </head>

        <body>

          ${printContents}

          <div class="thanks">

            THANK YOU ❤️<br/>
            VISIT AGAIN

          </div>

        </body>

      </html>

    `);

    printWindow.document.close();

    printWindow.focus();

    setTimeout(() => {

      printWindow.print();

      printWindow.close();

    }, 500);

  };

  // DOWNLOAD PDF

  const downloadPDF = async () => {

    const canvas =
      await html2canvas(
        receiptRef.current
      );

    const imgData =
      canvas.toDataURL("image/png");

    const pdf = new jsPDF({

      orientation: "portrait",

      unit: "mm",

      format: [80, 200],

    });

    const pdfWidth = 80;

    const pdfHeight =
      (canvas.height * pdfWidth) /
      canvas.width;

    pdf.addImage(
      imgData,
      "PNG",
      0,
      0,
      pdfWidth,
      pdfHeight
    );

    pdf.save("bill.pdf");

  };

  // REPORT DOWNLOAD

  const downloadReport = () => {

    const pdf = new jsPDF();

    let filteredBills = [];

    const today = new Date();

    if (reportType === "daily") {

      filteredBills = bills.filter((bill) => {

        const billDate =
          new Date(bill.date);

        return (
          billDate.toDateString() ===
          today.toDateString()
        );

      });

    }

    else if (
      reportType === "monthly"
    ) {

      filteredBills = bills.filter((bill) => {

        const billDate =
          new Date(bill.date);

        return (

          billDate.getMonth() ===
            today.getMonth() &&

          billDate.getFullYear() ===
            today.getFullYear()

        );

      });

    }

    else {

      filteredBills = bills.filter((bill) => {

        const billDate =
          new Date(bill.date);

        return (

          billDate.getFullYear() ===
          today.getFullYear()

        );

      });

    }

    const totalSales =
      filteredBills.reduce(
        (sum, bill) =>
          sum + bill.total,
        0
      );

    pdf.setFontSize(20);

    pdf.text(
      "ATITHI SALES REPORT",
      14,
      20
    );

    pdf.setFontSize(12);

    pdf.text(
      `Report Type: ${reportType.toUpperCase()}`,
      14,
      30
    );

    pdf.text(
      `Total Bills: ${filteredBills.length}`,
      14,
      38
    );

    pdf.text(
      `Total Sales: $${totalSales.toFixed(2)}`,
      14,
      46
    );

    autoTable(pdf, {

      startY: 55,

      head: [[
        "Bill No",
        "Date",
        "Items",
        "Total"
      ]],

      body: filteredBills.map((bill) => [

        bill.billNo,

        bill.date,

        bill.items.length,

        `$${bill.total.toFixed(2)}`

      ]),

    });

    pdf.save(
      `${reportType}-report.pdf`
    );

  };

  return (

    <div className="main-container">

      {/* TOPBAR */}

      <div className="topbar">

        <div className="brand">

          <img
            src={logo}
            alt="logo"
            className="top-logo"
          />

          <div>

            <h1>
              ATITHI
            </h1>

            <p>
              PURE VEG
            </p>

          </div>

        </div>

        <div className="menu-buttons">

          <button
            onClick={() =>
              setPage("billing")
            }
          >
            Billing
          </button>

          <button
            onClick={() =>
              setPage("history")
            }
          >
            History
          </button>

        </div>

      </div>

      {/* BILLING PAGE */}

      {page === "billing" && (

        <div className="card-box">

          <h2>
            Create Bill
          </h2>

          {/* TAX */}

          <div className="tax-box">

            <input
              type="text"
              value={taxName}
              placeholder="Tax Name"
              onChange={(e) =>
                setTaxName(
                  e.target.value
                )
              }
            />

            <input
              type="number"
              value={taxRate}
              placeholder="Tax %"
              onChange={(e) =>
                setTaxRate(
                  Number(
                    e.target.value
                  )
                )
              }
            />

          </div>

          {/* SEARCH */}

          <div className="form-row">

            <input
              type="text"
              placeholder="Search Item..."
              value={itemName}
              onChange={(e) => {

                setItemName(
                  e.target.value
                );

                const selectedProduct =
                  products.find(
                    (p) =>
                      p.name.toLowerCase() ===
                      e.target.value.toLowerCase()
                  );

                if (selectedProduct) {

                  setRate(
                    Number(
                      selectedProduct.rate
                    )
                  );

                }

              }}
              list="menu-items"
            />

            <datalist id="menu-items">

              {products?.map((product) => (

                <option
                  key={product.id}
                  value={product.name}
                >
                  {product.name}
                </option>

              ))}

            </datalist>

            <input
              type="number"
              value={rate}
              readOnly
              placeholder="Price"
            />

            <input
              type="number"
              value={qty}
              min="1"
              placeholder="Qty"
              onChange={(e) =>
                setQty(
                  Number(
                    e.target.value
                  )
                )
              }
            />

            <button
              onClick={addItem}
            >
              Add Item
            </button>

          </div>

          {/* TABLE */}

          <table>

            <thead>

              <tr>

                <th>
                  Item
                </th>

                <th>
                  Rate
                </th>

                <th>
                  Qty
                </th>

                <th>
                  Total
                </th>

                <th>
                  Delete
                </th>

              </tr>

            </thead>

            <tbody>

              {items.map(
                (item, index) => (

                  <tr key={index}>

                    <td>
                      {
                        item.itemName
                      }
                    </td>

                    <td>
                      $
                      {item.rate}
                    </td>

                    <td>
                      {item.qty}
                    </td>

                    <td>
                      $
                      {item.total.toFixed(
                        2
                      )}
                    </td>

                    <td>

                      <button
                        className="delete-btn"
                        onClick={() =>
                          removeItem(
                            index
                          )
                        }
                      >
                        X
                      </button>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

          {/* SUMMARY */}

          <div className="summary">

            <h3>
              Subtotal :
              $
              {subtotal.toFixed(
                2
              )}
            </h3>

            <h3>
              {taxName}
              {" ("}
              {taxRate}
              {"%) : $"}
              {tax.toFixed(2)}
            </h3>

            <h2>
              Total :
              $
              {total.toFixed(2)}
            </h2>

          </div>

          {/* SAVE */}

          <button
            className="save-btn"
            onClick={saveBill}
          >
            Save Bill
          </button>

          {/* RECENT SAVED BILL */}

          {selectedBill && (

            <div
              style={{
                marginTop: "30px",
              }}
            >

              <h2>
                Recent Saved Bill
              </h2>

              <div
                className="thermal-receipt"
                ref={receiptRef}
              >

                <div className="receipt-header">

                  <img
                    src={logo}
                    alt="logo"
                    className="receipt-logo"
                  />

                  <h2>
                    ATITHI
                  </h2>

                  <h4>
                    PURE VEG
                  </h4>

                  <p>
                    Calgary, Canada
                  </p>

                  <p>
                    +1
                    587-333-2292
                  </p>

                </div>

                <hr />

                <p>
                  Bill :
                  {
                    selectedBill.billNo
                  }
                </p>

                <p>
                  Date :
                  {
                    selectedBill.date
                  }
                </p>

                <hr />

                <table className="receipt-table">

                  <tbody>

                    {selectedBill.items.map(
                      (
                        item,
                        index
                      ) => (

                        <tr
                          key={index}
                        >

                          <td>
                            {
                              item.itemName
                            }
                          </td>

                          <td>
                            {
                              item.qty
                            }
                          </td>

                          <td>
                            $
                            {item.total.toFixed(
                              2
                            )}
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

                <hr />

                <div className="receipt-summary">

                  <p>

                    <span>
                      Subtotal
                    </span>

                    <span>
                      $
                      {selectedBill.subtotal.toFixed(
                        2
                      )}
                    </span>

                  </p>

                  <p>

                    <span>
                      {
                        selectedBill.taxName
                      }
                    </span>

                    <span>
                      $
                      {selectedBill.tax.toFixed(
                        2
                      )}
                    </span>

                  </p>

                  <h3>

                    <span>
                      Total
                    </span>

                    <span>
                      $
                      {selectedBill.total.toFixed(
                        2
                      )}
                    </span>

                  </h3>

                </div>

              </div>

              {/* BUTTONS */}

              <div
                className="receipt-buttons"
                style={{
                  marginTop: "20px",
                }}
              >

                <button
                  onClick={
                    printBill
                  }
                >
                  Print Bill
                </button>

                <button
                  onClick={
                    downloadPDF
                  }
                >
                  Download PDF
                </button>

              </div>

            </div>

          )}

        </div>

      )}

      {/* HISTORY PAGE */}

      {page === "history" && (

        <div className="card-box">

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "15px",
              marginBottom: "20px",
            }}
          >

            <h2>
              Billing History
            </h2>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >

              <select
                value={reportType}
                onChange={(e) =>
                  setReportType(
                    e.target.value
                  )
                }
              >

                <option value="daily">
                  Daily Report
                </option>

                <option value="monthly">
                  Monthly Report
                </option>

                <option value="yearly">
                  Yearly Report
                </option>

              </select>

              <button
                onClick={
                  downloadReport
                }
              >
                Download PDF
              </button>

            </div>

          </div>

          <div className="summary">

            <h3>
              Total Bills :
              {bills.length}
            </h3>

            <h3>
              Total Revenue :
              $
              {bills
                .reduce(
                  (sum, bill) =>
                    sum + bill.total,
                  0
                )
                .toFixed(2)}
            </h3>

          </div>

          <div className="recent-history">

            <h3>
              All Saved Bills
            </h3>

            {bills.map((bill) => (

              <div
                key={bill.id}
                className="history-card"
              >

                <div>

                  <strong>
                    {bill.billNo}
                  </strong>

                  <p>
                    {bill.date}
                  </p>

                  <p>
                    Total :
                    $
                    {bill.total.toFixed(
                      2
                    )}
                  </p>

                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                  }}
                >

                  <button
                    onClick={() => {

                      setSelectedBill(
                        bill
                      );

                      setTimeout(() => {

                        printBill();

                      }, 300);

                    }}
                  >
                    Print
                  </button>

                  <button
                    onClick={() => {

                      setSelectedBill(
                        bill
                      );

                      setTimeout(() => {

                        downloadPDF();

                      }, 300);

                    }}
                  >
                    PDF
                  </button>

                </div>

              </div>

            ))}

          </div>

        </div>

      )}

    </div>

  );

}

export default App;