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
  const [selectedBill, setSelectedBill] = useState(null);

  const [itemName, setItemName] = useState("");
  const [rate, setRate] = useState("");
  const [qty, setQty] = useState(1);

  const [customerName, setCustomerName] =
    useState("");

  const [billCounter, setBillCounter] =
    useState(
      Number(
        localStorage.getItem("billCounter")
      ) || 1
    );

  const [taxName, setTaxName] =
    useState(
      localStorage.getItem("taxName") ||
      "HST"
    );

  const [taxRate, setTaxRate] =
    useState(
      Number(
        localStorage.getItem("taxRate")
      ) || 13
    );

  const [reportType, setReportType] =
    useState("daily");

  // LOAD DATA

  useEffect(() => {

    fetchMenuItems();

    const savedBills =
      JSON.parse(
        localStorage.getItem("bills")
      ) || [];

    setBills(savedBills);

  }, []);

  // FETCH MENU

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

  // SAVE STORAGE

  useEffect(() => {

    localStorage.setItem(
      "bills",
      JSON.stringify(bills)
    );

  }, [bills]);

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

  useEffect(() => {

    localStorage.setItem(
      "billCounter",
      billCounter
    );

  }, [billCounter]);

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
        "BILL-" + billCounter,

      customerName,

      date:
        new Date().toLocaleString(),

      items,

      subtotal,

      tax,

      total,

      taxName,

      taxRate,

    };

    const updatedBills = [
      bill,
      ...bills,
    ];

    setBills(updatedBills);

    setBillCounter(
      billCounter + 1
    );

    setSelectedBill(bill);

    setItems([]);

    setItemName("");

    setRate("");

    setQty(1);

    setCustomerName("");

    alert("Bill Saved");

  };

  // PRINT BILL

  const printBill = () => {

    if (!receiptRef.current) {

      alert("Bill not found");

      return;

    }

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

          <title>ATITHI BILL</title>

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

            h2{
              margin:0;
              font-size:22px;
              text-align:center;
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

            .receipt-table th{
              font-size:12px;
              padding:5px 0;
              border-bottom:1px dashed #000;
              text-align:left;
            }

            .receipt-table td{
              padding:5px 0;
              font-size:12px;
            }

            .receipt-summary p,
            .receipt-summary h3{
              display:flex;
              justify-content:space-between;
            }

          </style>

        </head>

        <body>

          ${printContents}

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

  // PDF

  const downloadPDF = async () => {

    if (!receiptRef.current) {

      alert("Bill not found");

      return;

    }

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

    pdf.save("Atithi-Bill.pdf");

  };

  // REPORT PDF

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
      reportType === "weekly"
    ) {

      const weekAgo =
        new Date();

      weekAgo.setDate(
        today.getDate() - 7
      );

      filteredBills = bills.filter((bill) => {

        const billDate =
          new Date(bill.date);

        return (
          billDate >= weekAgo
        );

      });

    }

    else {

      filteredBills = bills;

    }

    const totalRevenue =
      filteredBills.reduce(
        (sum, bill) =>
          sum + bill.total,
        0
      );

    pdf.setFontSize(22);

    pdf.text(
      "ATITHI SALES REPORT",
      14,
      20
    );

    pdf.setFontSize(12);

    pdf.text(
      `Report Type: ${reportType.toUpperCase()}`,
      14,
      32
    );

    pdf.text(
      `Total Bills: ${filteredBills.length}`,
      14,
      40
    );

    pdf.text(
      `Total Revenue: $${totalRevenue.toFixed(
        2
      )}`,
      14,
      48
    );

    autoTable(pdf, {

      startY: 60,

      head: [[
        "Bill No",
        "Customer",
        "Date",
        "Total"
      ]],

      body:
        filteredBills.map((bill) => [

          bill.billNo,

          bill.customerName,

          bill.date,

          `$${bill.total.toFixed(
            2
          )}`

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
              PREMIUM BILLING
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
            Create Premium Bill
          </h2>

          <div className="form-row">

            <input
              type="text"
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) =>
                setCustomerName(
                  e.target.value
                )
              }
            />

          </div>

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
                  Number(e.target.value)
                )
              }
            />

          </div>

          {/* ITEM SECTION */}

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

                <th>Item</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Delete</th>

              </tr>

            </thead>

            <tbody>

              {items.map((item, index) => (

                <tr key={index}>

                  <td>
                    {item.itemName}
                  </td>

                  <td>
                    ${item.rate}
                  </td>

                  <td>
                    {item.qty}
                  </td>

                  <td>
                    $
                    {item.total.toFixed(2)}
                  </td>

                  <td>

                    <button
                      className="delete-btn"
                      onClick={() =>
                        removeItem(index)
                      }
                    >
                      X
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

          {/* SUMMARY */}

          <div className="summary">

            <h3>
              Subtotal :
              $
              {subtotal.toFixed(2)}
            </h3>

            <h3>
              {taxName}
              (
              {taxRate}%)
              :
              $
              {tax.toFixed(2)}
            </h3>

            <h2>
              Grand Total :
              $
              {total.toFixed(2)}
            </h2>

          </div>

          <button
            className="save-btn"
            onClick={saveBill}
          >
            Save Bill
          </button>

        </div>

      )}

      {/* HISTORY PAGE */}

      {page === "history" && (

        <div className="card-box">

          <h2>
            Billing History
          </h2>

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
                    {bill.customerName}
                  </p>

                  <p>
                    {bill.date}
                  </p>

                  <p>
                    Total :
                    $
                    {bill.total.toFixed(2)}
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

      {/* HIDDEN RECEIPT */}

      <div
        ref={receiptRef}
        style={{
          position: "absolute",
          left: "-9999px",
          background: "#fff",
          padding: "20px",
          width: "300px",
        }}
      >

        <div>

          <div
            style={{
              textAlign: "center",
            }}
          >

            <img
              src={logo}
              alt="logo"
              style={{
                width: "70px",
                marginBottom: "8px",
              }}
            />

            <h2>
              ATITHI PURE VEG
            </h2>

            <p>
              Premium Indian Restaurant
            </p>

            <p>
              5471 Falsbridge Dr NE, Calgary, AB T3J 3E8, Canada
            </p>

          

          </div>

          <hr />

          <p>
            Customer :
            {selectedBill?.customerName}
          </p>

          <hr />

          <table className="receipt-table">

            <thead>

              <tr>

                <th>Item</th>
                <th>Qty</th>
                <th>Total</th>

              </tr>

            </thead>

            <tbody>

              {(selectedBill?.items || []).map(
                (item, index) => (

                  <tr key={index}>

                    <td>
                      {item.itemName}
                    </td>

                    <td>
                      {item.qty}
                    </td>

                    <td>
                      $
                      {item.total.toFixed(2)}
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
                {selectedBill?.subtotal?.toFixed(2)}
              </span>

            </p>

            <p>

              <span>
                {selectedBill?.taxName}
                (
                {selectedBill?.taxRate}
                %)
              </span>

              <span>
                $
                {selectedBill?.tax?.toFixed(2)}
              </span>

            </p>

            <h3>

              <span>
                 TOTAL
              </span>

              <span>
                $
                {selectedBill?.total?.toFixed(2)}
              </span>

            </h3>

          </div>

          <hr />

          <div
            style={{
              textAlign: "center",
              marginTop: "15px",
              fontWeight: "bold",
            }}
          >

            THANK YOU ❤️<br />
            VISIT AGAIN

          </div>

        </div>

      </div>

    </div>

  );

}

export default App;