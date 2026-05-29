import { useEffect, useRef, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { supabase } from "./supabase";
import logo from "./assets/Atithi Logo.png";
import "./App.css";

function App() {

  const ADMIN_PASSWORD = "Atithi1212";

  const receiptRef = useRef();

  const [page, setPage] =
    useState("billing");

  const [products, setProducts] =
    useState([]);

  const [todayBills, setTodayBills] =
    useState([]);

  const [historyBills, setHistoryBills] =
    useState([]);

  const [selectedBill, setSelectedBill] =
    useState(null);

  // NEW STATES

  const [selectedDayBills, setSelectedDayBills] =
    useState([]);

  const [selectedDay, setSelectedDay] =
    useState("");

  const [items, setItems] =
    useState([]);

  const [itemName, setItemName] =
    useState("");

  const [rate, setRate] =
    useState("");

  const [qty, setQty] =
    useState(1);

  const [customerName, setCustomerName] =
    useState("");

  const [shiftPerson, setShiftPerson] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("Cash");

  const [cardType, setCardType] =
    useState("");

  const [taxUnlocked, setTaxUnlocked] =
    useState(false);

    const [reportDate, setReportDate] =
  useState("");

const [reportMonth, setReportMonth] =
  useState("");

const [reportYear, setReportYear] =
  useState("");

  // DAILY BILL COUNTER

  const todayDate =
    new Date()
      .toLocaleDateString();

  const savedDate =
    localStorage.getItem(
      "billDate"
    );

  const savedCounter =
    Number(
      localStorage.getItem(
        "billCounter"
      )
    ) || 1;

  const startingCounter =
    savedDate === todayDate
      ? savedCounter
      : 1;

  const [billCounter, setBillCounter] =
    useState(startingCounter);

  const [taxName, setTaxName] =
    useState(
      localStorage.getItem(
        "taxName"
      ) || "HST"
    );

  const [taxRate, setTaxRate] =
    useState(
      Number(
        localStorage.getItem(
          "taxRate"
        )
      ) || 13
    );

  // LOAD STORAGE

  useEffect(() => {

fetchProducts();
    const savedTodayBills =
      JSON.parse(
        localStorage.getItem(
          "todayBills"
        )
      ) || [];

    const savedHistoryBills =
      JSON.parse(
        localStorage.getItem(
          "historyBills"
        )
      ) || [];

    setTodayBills(savedTodayBills);

    setHistoryBills(savedHistoryBills);

  }, []);

  // SAVE STORAGE

  useEffect(() => {

    localStorage.setItem(
      "todayBills",
      JSON.stringify(todayBills)
    );

  }, [todayBills]);

  useEffect(() => {

    localStorage.setItem(
      "historyBills",
      JSON.stringify(historyBills)
    );

  }, [historyBills]);

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

  // DAILY COUNTER SAVE

  useEffect(() => {

    localStorage.setItem(
      "billCounter",
      billCounter
    );

    localStorage.setItem(
      "billDate",
      todayDate
    );

  }, [billCounter, todayDate]);

  // FETCH MENU

  const fetchProducts = async () => {

  try {

    const { data, error } =
      await supabase
        .from("menu")
        .select("*");

    if (error) {

      console.log(error);

      return;

    }

    const allItems = [];

    data.forEach((category) => {

      if (
        category &&
        Array.isArray(category.items)
      ) {

        category.items.forEach(
          (item, index) => {

            allItems.push({

              id:
                `${category.id}-${index}`,

              name:
                item.name || "",

              rate:
                Number(
                  item.price || 0
                ),

              category:
                category.title || "",

            });

          }
        );

      }

    });

    setProducts(allItems);

  } catch (err) {

    console.log(err);

  }

};


  // ADD ITEM

  const addItem = () => {

    if (
      !itemName ||
      !qty ||
      !rate
    ) {

      alert("Fill all fields");

      return;

    }

    const newItem = {

      itemName,

      rate,

      qty,

      total:
        Number(rate) *
        Number(qty),

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

      alert("Add items");

      return;

    }

    const today = new Date();

const currentDate =
  `${String(
    today.getDate()
  ).padStart(2, "0")}/${
    String(
      today.getMonth() + 1
    ).padStart(2, "0")
  }/${
    today.getFullYear()
  }`;

    const currentTime =
      new Date()
        .toLocaleTimeString();

    const bill = {

      id: Date.now(),

      billNo:
        "BILL-" + billCounter,

      customerName,

      shiftPerson,

      paymentMethod,

      cardType,

      date: currentDate,

      time: currentTime,

      items,

      subtotal,

      tax,

      total,

      taxName,

      taxRate,

    };

    const updatedBills = [
      bill,
      ...todayBills,
    ];

    setTodayBills(updatedBills);

    setSelectedBill(bill);

    setBillCounter(
      (prev) => prev + 1
    );

    setItems([]);

    setItemName("");

    setRate("");

    setQty(1);

    setCustomerName("");

    setShiftPerson("");

    setPaymentMethod("Cash");

    setCardType("");

    

    alert("Bill Saved");

  };

  // CLOSE SHIFT

  const closeShift = () => {

    if (
      todayBills.length === 0
    ) {

      alert("No Bills");

      return;

    }
const today = new Date();

const groupedDate =
  `${String(
    today.getDate()
  ).padStart(2, "0")}/${
    String(
      today.getMonth() + 1
    ).padStart(2, "0")
  }/${
    today.getFullYear()
  }`;

    const totalRevenue =
      todayBills.reduce(
        (sum, bill) =>
          sum + bill.total,
        0
      );

    const shiftData = {

      id: Date.now(),

      date: groupedDate,

      totalRevenue,

      billsCount:
        todayBills.length,

      bills: todayBills,

    };

    const updatedHistory = [
      shiftData,
      ...historyBills,
    ];

    setHistoryBills(updatedHistory);

    setTodayBills([]);

    alert(
      "Day Closed Successfully"
    );

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

            table{
              width:100%;
              border-collapse:collapse;
            }

            td,th{
              padding:5px;
              font-size:12px;
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

  // DOWNLOAD PDF

  const downloadPDF = async () => {

    if (!receiptRef.current)
      return;

    const canvas =
      await html2canvas(
        receiptRef.current
      );

    const imgData =
      canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [80, 220],
    });

    const width = 80;

    const height =
      (canvas.height * width) /
      canvas.width;

    pdf.addImage(
      imgData,
      "PNG",
      0,
      0,
      width,
      height
    );

    pdf.save(
      "Atithi-Bill.pdf"
    );

  };

  // REPORT

  //daily report 
 
  const downloadDailyReport = () => {

  if (!reportDate) {
    alert("Select Date");
    return;
  }

  try {

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    doc.setFontSize(18);
    doc.text("Daily Report", 14, 20);

   



    let allBills = [];

historyBills.forEach((day) => {

  if (
    !day ||
    !day.date ||
    !Array.isArray(day.bills)
  ) {
    return;
  }

  const parts =
    String(day.date).split("/");

  const formattedDate =
    `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;

  if (formattedDate === reportDate) {
    allBills.push(...day.bills);
  }

});

 
         if (allBills.length === 0) {
      alert("No Data Found");
      return;
    }

    const tableData = [];
    const itemSummary = {};

    let subtotalAmount = 0;
    let taxAmount = 0;
    let finalAmount = 0;

    const paymentSummary = {
      Cash: 0,
      CreditCard: 0,
      DebitCard: 0,
    };

    const cardSummary = {};

    allBills.forEach((bill) => {

      if (bill.paymentMethod === "Cash") {
        paymentSummary.Cash += Number(
          bill.total || 0
        );
      }

      if (bill.paymentMethod === "Credit Card") {

        paymentSummary.CreditCard += Number(
          bill.total || 0
        );

        const card =
          bill.cardType || "Unknown";

        if (!cardSummary[card]) {
          cardSummary[card] = 0;
        }

        cardSummary[card] += Number(
          bill.total || 0
        );

      }

      if (bill.paymentMethod === "Debit Card") {
        paymentSummary.DebitCard += Number(
          bill.total || 0
        );
      }

      subtotalAmount += Number(
        bill.subtotal || 0
      );

      taxAmount += Number(
        bill.tax || 0
      );

      finalAmount += Number(
        bill.total || 0
      );

      const itemsText =
        bill.items
          .map(
            (item) =>
              `${item.itemName} (${item.qty})`
          )
          .join(", ");

      tableData.push([
        bill.billNo,
        bill.customerName || "-",
        bill.shiftPerson || "-",
        bill.paymentMethod || "-",
        itemsText,
        `$${Number(
          bill.total || 0
        ).toFixed(2)}`,
      ]);

      bill.items.forEach((item) => {

        if (!itemSummary[item.itemName]) {

          itemSummary[item.itemName] = {
            qty: 0,
            revenue: 0,
          };

        }

        itemSummary[item.itemName].qty +=
          Number(item.qty);

        itemSummary[item.itemName].revenue +=
          Number(item.total);

      });

    });

    autoTable(doc, {
      head: [[
        "Bill No",
        "Customer",
        "Shift Person",
        "Payment",
        "Items",
        "Final Total",
      ]],
      body: tableData,
      startY: 30,
    });

    const summaryData =
      Object.keys(itemSummary).map(
        (itemName) => [
          itemName,
          itemSummary[itemName].qty,
          `$${itemSummary[itemName].revenue.toFixed(2)}`,
        ]
      );

    doc.text(
      "Product Sales Summary",
      14,
      doc.lastAutoTable.finalY + 15
    );

    autoTable(doc, {
      startY:
        doc.lastAutoTable.finalY + 20,
      head: [[
        "Product",
        "Qty Sold",
        "Revenue",
      ]],
      body: summaryData,
    });

    doc.text(
      "Payment Summary",
      14,
      doc.lastAutoTable.finalY + 15
    );

    autoTable(doc, {
      startY:
        doc.lastAutoTable.finalY + 20,
      head: [[
        "Payment Type",
        "Amount",
      ]],
      body: [
        [
          "Cash",
          `$${paymentSummary.Cash.toFixed(2)}`
        ],
        [
          "Credit Card",
          `$${paymentSummary.CreditCard.toFixed(2)}`
        ],
        [
          "Debit Card",
          `$${paymentSummary.DebitCard.toFixed(2)}`
        ],
      ],
    });

    const cardData =
      Object.keys(cardSummary).map(
        (card) => [
          card,
          `$${cardSummary[card].toFixed(2)}`
        ]
      );

    if (cardData.length > 0) {

      doc.text(
        "Card Type Summary",
        14,
        doc.lastAutoTable.finalY + 15
      );

      autoTable(doc, {
        startY:
          doc.lastAutoTable.finalY + 20,
        head: [[
          "Card Type",
          "Amount",
        ]],
        body: cardData,
      });

    }

    autoTable(doc, {
      startY:
        doc.lastAutoTable.finalY + 20,
      head: [[
        "Summary",
        "Value",
      ]],
      body: [
        [
          "Subtotal Revenue",
          `$${subtotalAmount.toFixed(2)}`
        ],
        [
          "Tax Collected",
          `$${taxAmount.toFixed(2)}`
        ],
        [
          "Final Revenue",
          `$${finalAmount.toFixed(2)}`
        ],
        [
          "Total Bills",
          String(allBills.length)
        ],
      ],
    });

    doc.save("Daily-Report.pdf");

  } 
  catch (error) {

  console.error(error);

  alert(
    "Daily PDF Error: " +
    error.message
  );

}

};



  // MONTHLY REPORT

const downloadMonthlyReport = () => {

  if (!reportMonth) {

    alert("Select Month");

    return;

  }

  try {

const doc = new jsPDF({
  orientation: "portrait",
  unit: "mm",
  format: "a4",
});
    doc.setFontSize(18);

    doc.text("Monthly Report", 14, 20);

    const [year, month] =
      reportMonth.split("-");

    let allBills = [];

    historyBills.forEach((day) => {

      if (
        !day ||
        !day.date ||
        !Array.isArray(day.bills)
      ) {

        return;

      }

      const parts =
        String(day.date).split("/");

      const d = new Date(

  Number(parts[2]),

  Number(parts[1]) - 1,

  Number(parts[0])

);
      if (

        d.getFullYear() ===
          Number(year) &&

        d.getMonth() + 1 ===
          Number(month)

      ) {

        allBills.push(
          ...day.bills
        );

      }

    });

    if (allBills.length === 0) {

      alert("No Monthly Data");

      return;

    }

    const tableData = [];

    const itemSummary = {};

    let subtotalAmount = 0;

    let taxAmount = 0;

    let finalAmount = 0;


    const paymentSummary = {
  Cash: 0,
  CreditCard: 0,
  DebitCard: 0,
};

const cardSummary = {};

    allBills.forEach((bill) => {

if (bill.paymentMethod === "Cash") {
  paymentSummary.Cash += Number(
    bill.total || 0
  );
}

if (
  bill.paymentMethod ===
  "Credit Card"
) {
  paymentSummary.CreditCard +=
    Number(bill.total || 0);

  const card =
    bill.cardType || "Unknown";

  if (!cardSummary[card]) {
    cardSummary[card] = 0;
  }

  cardSummary[card] += Number(
    bill.total || 0
  );
}

if (
  bill.paymentMethod ===
  "Debit Card"
) {
  paymentSummary.DebitCard +=
    Number(bill.total || 0);
}

      subtotalAmount += Number(
        bill.subtotal || 0
      );

      taxAmount += Number(
        bill.tax || 0
      );

      finalAmount += Number(
        bill.total || 0
      );

      const itemsText =
        bill.items
          .map(
            (item) =>
              `${item.itemName} (${item.qty})`
          )
          .join(", ");

      tableData.push([

        bill.billNo,

        bill.customerName || "-",

        bill.shiftPerson || "-",

        bill.paymentMethod || "-",

        itemsText,

        `$${Number(
          bill.total || 0
        ).toFixed(2)}`,

      ]);

      bill.items.forEach((item) => {

        if (
          !itemSummary[
            item.itemName
          ]
        ) {

          itemSummary[
            item.itemName
          ] = {

            qty: 0,

            revenue: 0,

          };

        }

        itemSummary[
          item.itemName
        ].qty += Number(item.qty);

        itemSummary[
          item.itemName
        ].revenue += Number(
          item.total
        );

      });

    });

    autoTable(doc, {

      head: [[

        "Bill No",

        "Customer",

        "Shift Person",

        "Payment",

        "Items",

        "Final Total",

      ]],

      body: tableData,

      startY: 30,

    });

    const summaryData =
      Object.keys(
        itemSummary
      ).map((itemName) => [

        itemName,

        itemSummary[
          itemName
        ].qty,

        `$${itemSummary[
          itemName
        ].revenue.toFixed(2)}`,

      ]);

    const summaryY =
      doc.lastAutoTable.finalY + 20;

    doc.setFontSize(16);

    doc.text(
      "Product Sales Summary",
      14,
      summaryY
    );

    autoTable(doc, {

      startY: summaryY + 10,

      head: [[
        "Product",
        "Qty Sold",
        "Revenue",
      ]],

      body: summaryData,

    });

const paymentY =
  doc.lastAutoTable.finalY + 20;

doc.setFontSize(16);

doc.text(
  "Payment Summary",
  14,
  paymentY
);

autoTable(doc, {
  startY: paymentY + 10,

  head: [[
    "Payment Type",
    "Amount",
  ]],

  body: [
    [
      "Cash",
      `$${paymentSummary.Cash.toFixed(
        2
      )}`,
    ],

    [
      "Credit Card",
      `$${paymentSummary.CreditCard.toFixed(
        2
      )}`,
    ],

    [
      "Debit Card",
      `$${paymentSummary.DebitCard.toFixed(
        2
      )}`,
    ],
  ],
});

    
    const finalSummaryY =
      doc.lastAutoTable.finalY + 20;

    doc.setFontSize(14);
autoTable(doc, {
  startY: doc.lastAutoTable.finalY + 20,

  head: [[
    "Summary",
    "Value",
  ]],

  body: [
    [
      "Subtotal Revenue",
      `$${subtotalAmount.toFixed(2)}`
    ],

    [
      "Tax Collected",
      `$${taxAmount.toFixed(2)}`
    ],

    [
      "Final Revenue",
      `$${finalAmount.toFixed(2)}`
    ],

    [
      "Total Bills",
      allBills.length
    ],
  ],
});
    
    doc.save(
      "Monthly-Report.pdf"
    );

  } catch (error) {

    console.log(error);

    alert("Monthly PDF Error");

  }

};


//yearly report 

const downloadYearlyReport = () => {

  if (!reportYear) {

    alert("Enter Year");

    return;

  }

  try {

const doc = new jsPDF({
  orientation: "portrait",
  unit: "mm",
  format: "a4",
});
    doc.setFontSize(18);

    doc.text("Yearly Report", 14, 20);

    let allBills = [];

    historyBills.forEach((day) => {

      if (
        !day ||
        !day.date ||
        !Array.isArray(day.bills)
      ) {

        return;

      }

      const parts =
        String(day.date).split("/");

     const d = new Date(

  Number(parts[2]),

  Number(parts[1]) - 1,

  Number(parts[0])

);


if (
  String(d.getFullYear()) ===
  String(reportYear)
)

      
{

        allBills.push(
          ...day.bills
        );

      }

    });

    if (allBills.length === 0) {

      alert("No Yearly Data");

      return;

    }

    // MONTH SUMMARY

    const monthSummary = {};

    // PRODUCT SUMMARY

    const itemSummary = {};

    let subtotalAmount = 0;

    let taxAmount = 0;

    let finalAmount = 0;

const paymentSummary = {
  Cash: 0,
  CreditCard: 0,
  DebitCard: 0,
};

const cardSummary = {};

    allBills.forEach((bill) => {

if (bill.paymentMethod === "Cash") {
  paymentSummary.Cash += Number(
    bill.total || 0
  );
}

if (
  bill.paymentMethod ===
  "Credit Card"
) {
  paymentSummary.CreditCard +=
    Number(bill.total || 0);

  const card =
    bill.cardType || "Unknown";

  if (!cardSummary[card]) {
    cardSummary[card] = 0;
  }

  cardSummary[card] += Number(
    bill.total || 0
  );
}

if (
  bill.paymentMethod ===
  "Debit Card"
) {
  paymentSummary.DebitCard +=
    Number(bill.total || 0);
}


      subtotalAmount += Number(
        bill.subtotal || 0
      );

      taxAmount += Number(
        bill.tax || 0
      );

      finalAmount += Number(
        bill.total || 0
      );

      const parts =
  String(bill.date).split("/");

if (parts.length !== 3) return;

const billDate =
  new Date(
    Number(parts[2]),     // Year
    Number(parts[1]) - 1, // Month
    Number(parts[0])      // Day
  );           
      const monthName =
        billDate.toLocaleString(
          "default",
          { month: "long" }
        );

      // MONTH DATA

      if (
        !monthSummary[monthName]
      ) {

        monthSummary[
          monthName
        ] = {

          bills: 0,

          revenue: 0,

        };

      }

      monthSummary[
        monthName
      ].bills += 1;

      monthSummary[
        monthName
      ].revenue += Number(
        bill.total || 0
      );

      // PRODUCT DATA

      bill.items.forEach((item) => {

        if (
          !itemSummary[
            item.itemName
          ]
        ) {

          itemSummary[
            item.itemName
          ] = {

            qty: 0,

            revenue: 0,

          };

        }

        itemSummary[
          item.itemName
        ].qty += Number(item.qty);

        itemSummary[
          item.itemName
        ].revenue += Number(
          item.total
        );

      });

    });

    // MONTH TABLE

    const tableData =
      Object.keys(
        monthSummary
      ).map((month) => [

        month,

        monthSummary[month]
          .bills,

        `$${monthSummary[
          month
        ].revenue.toFixed(2)}`,

      ]);

    autoTable(doc, {

      head: [[

        "Month",

        "Total Bills",

        "Revenue",

      ]],

      body: tableData,

      startY: 30,

    });

    // PRODUCT SUMMARY TABLE

const paymentY =
  doc.lastAutoTable.finalY + 20;

doc.setFontSize(16);

doc.text(
  "Payment Summary",
  14,
  paymentY
);

autoTable(doc, {
  startY: doc.lastAutoTable.finalY + 20,

  head: [[
    "Summary",
    "Value",
  ]],

  body: [
    [
      "Subtotal Revenue",
      `$${subtotalAmount.toFixed(2)}`
    ],

    [
      "Tax Collected",
      `$${taxAmount.toFixed(2)}`
    ],

    [
      "Final Revenue",
      `$${finalAmount.toFixed(2)}`
    ],

    [
      "Total Bills",
      allBills.length
    ],
  ],
});

    const summaryData =
      Object.keys(
        itemSummary
      ).map((itemName) => [

        itemName,

        itemSummary[
          itemName
        ].qty,

        `$${itemSummary[
          itemName
        ].revenue.toFixed(2)}`,

      ]);

    const summaryY =
      doc.lastAutoTable.finalY + 20;

    doc.setFontSize(16);

    doc.text(
      "Product Sales Summary",
      14,
      summaryY
    );

    autoTable(doc, {

      startY: summaryY + 10,

      head: [[
        "Product",
        "Qty Sold",
        "Revenue",
      ]],

      body: summaryData,

    });

    // FINAL TOTALS

    const finalSummaryY =
      doc.lastAutoTable.finalY + 20;

    doc.setFontSize(14);

    doc.text(
      `Subtotal Revenue: $${subtotalAmount.toFixed(2)}`,
      14,
      finalSummaryY
    );

    doc.text(
      `Tax Collected: $${taxAmount.toFixed(2)}`,
      14,
      finalSummaryY + 10
    );

    doc.text(
      `Final Revenue: $${finalAmount.toFixed(2)}`,
      14,
      finalSummaryY + 20
    );

    doc.text(
      `Total Bills: ${allBills.length}`,
      14,
      finalSummaryY + 30
    );

    doc.save(
      "Yearly-Report.pdf"
    );

  } catch (error) {

    console.log(error);

    alert("Yearly PDF Error");

  }

};
  // TODAY REVENUE

  const saveAndPrintBill = () => {

  if (items.length === 0) {
    alert("Add items");
    return;
  }

  const today = new Date();

  const currentDate =
    `${String(today.getDate()).padStart(2, "0")}/${
      String(today.getMonth() + 1).padStart(2, "0")
    }/${today.getFullYear()}`;

  const currentTime =
    today.toLocaleTimeString();

  const bill = {
    id: Date.now(),
    billNo: "BILL-" + billCounter,
    customerName,
    shiftPerson,
    paymentMethod,
    cardType,
    date: currentDate,
    time: currentTime,
    items,
    subtotal,
    tax,
    total,
    taxName,
    taxRate,
  };

  setTodayBills([bill, ...todayBills]);

  setSelectedBill(bill);

  setBillCounter(prev => prev + 1);

  setTimeout(() => {
    printBill();
  }, 1000);

  setTimeout(() => {

    setItems([]);
    setItemName("");
    setRate("");
    setQty(1);
    setCustomerName("");
    setShiftPerson("");
    setPaymentMethod("Cash");
    setCardType("");

  }, 1500);

  alert("Bill Saved & Printing...");
};

  const todayRevenue =
    todayBills.reduce(
      (sum, bill) =>
        sum + bill.total,
      0
    );

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
              setPage("today")
            }
          >
            Today Bills
          </button>

          <button
            onClick={() => {

              const pass =
                prompt(
                  "Enter Admin Password"
                );

              if (
                pass === ADMIN_PASSWORD
              ) {

                setPage("history");

              } else {

                alert(
                  "Wrong Password"
                );

              }

            }}
          >
            History
          </button>

        </div>

      </div>


      {/* BILLING */}

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

      <input
        type="text"
        placeholder="Shift Person"
        value={shiftPerson}
        onChange={(e) =>
          setShiftPerson(
            e.target.value
          )
        }
      />

    </div>

   <div className="tax-box">

  {!taxUnlocked ? (

    <button
      onClick={() => {

        const pass =
          prompt(
            "Enter Admin Password"
          );

        if (
          pass === ADMIN_PASSWORD
        ) {

          setTaxUnlocked(true);

        } else {

          alert(
            "Wrong Password"
          );

        }

      }}
    >
      Unlock Tax
    </button>

  ) : (

    <div
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >

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

      <button
        onClick={() => {

          setTaxUnlocked(false);

        }}
      >
        Lock Tax
      </button>

    </div>

  )}

</div>

    <div className="form-row">

      <div
  style={{
    width: "100%",
    marginBottom: "20px",
  }}
>

  <input
    type="text"
    placeholder="Search Menu Item..."
    value={itemName}
    onChange={(e) =>
      setItemName(
        e.target.value
      )
    }
    style={{
      width: "100%",
      padding: "14px",
      borderRadius: "12px",
      border: "1px solid #ccc",
      marginBottom: "15px",
      fontSize: "16px",
    }}
  />

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit,minmax(180px,1fr))",
      gap: "12px",
      maxHeight: "250px",
      overflowY: "auto",
      padding: "5px",
    }}
  >

    {products
      .filter((product) =>
        product.name
          .toLowerCase()
          .includes(
            itemName.toLowerCase()
          )
      )
      .map((product) => (

        <div
          key={product.id}
          onClick={() => {

            setItemName(
              product.name
            );

            setRate(
              Number(
                product.rate
              )
            );

          }}
          style={{
            padding: "15px",
            borderRadius: "14px",
            background: "#fff",
            border:
              "1px solid #eee",
            cursor: "pointer",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
            transition: "0.2s",
          }}
        >

          <h4
            style={{
              margin: 0,
              color: "#111",
            }}
          >
            {product.name}
          </h4>

          <p
            style={{
              marginTop: "8px",
              fontWeight: "bold",
              color: "#ff3d5a",
            }}
          >
            ${product.rate}
          </p>

        </div>

      ))}

  </div>

</div>


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

    <div className="payment-box">

      <select
        value={paymentMethod}
        onChange={(e) =>
          setPaymentMethod(
            e.target.value
          )
        }
      >

        <option value="Cash">
          Cash
        </option>

        <option value="Credit Card">
          Credit Card
        </option>

        <option value="Debit Card">
          Debit Card
        </option>

      </select>

      {paymentMethod ===
        "Credit Card" && (

        <select
          value={cardType}
          onChange={(e) =>
            setCardType(
              e.target.value
            )
          }
        >

          <option value="">
            Select Card
          </option>

          <option value="Visa">
            Visa
          </option>

          <option value="Master Card">
            Master Card
          </option>

          <option value="American Express">
            American Express
          </option>

        </select>

      )}

    </div>

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
      Pay & Save Bill
    </button>
    

  </div>

)}

      {/* TODAY */}

      {page === "today" && (

        <div className="card-box">

          <h2>
            Today Billing
          </h2>

          <h3>
            Revenue :
            $
            {todayRevenue.toFixed(2)}
          </h3>

          <button
            className="save-btn"
            onClick={closeShift}
          >
            Close Shift
          </button>

          <div className="recent-history">

            {todayBills.map((bill) => (

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
                    Payment :
                    {bill.paymentMethod}
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

{/* HIDDEN RECEIPT */}

{selectedBill && (

  <div
    style={{
      position: "absolute",
      left: "-9999px",
      top: "0",
    }}
  >

    <div
      ref={receiptRef}
      style={{
        width: "280px",
        padding: "10px",
        background: "#fff",
        color: "#000",
        fontFamily: "Arial",
        fontSize: "12px",
      }}
    >

      {/* LOGO */}

      <div
        style={{
          textAlign: "center",
        }}
      >

        <img
          src={logo}
          alt="logo"
          style={{
            width: "120px",
            marginBottom: "p4x",
          }}
        />


        <p
          style={{
            margin: "1px 0",
          }}
        >
          5471 Falsbridge Dr NE
        </p>

        <p
          style={{
            margin: "3px 0",
          }}
        >
          Calgary, AB T3J 3E8
        </p>

      </div>

      <hr
        style={{
          borderStyle: "dashed",
        }}
      />

      {/* BILL INFO */}

      <p>
        Bill No :
        {selectedBill.billNo}
      </p>

      <p>
        Customer :
        {selectedBill.customerName}
      </p>

      <p>
        Date :
        {selectedBill.date}
      </p>

      <p>
        Time :
        {selectedBill.time}
      </p>

      
      <hr
        style={{
          borderStyle: "dashed",
        }}
      />

      {/* ITEMS */}

      <table
        style={{
          width: "100%",
          borderCollapse:
            "collapse",
        }}
      >

        <thead>

          <tr>

            <th
              align="left"
            >
              Item
            </th>

            <th>
              Qty
            </th>

            <th
              align="right"
            >
              Total
            </th>

          </tr>

        </thead>

        <tbody>

          {selectedBill.items.map(
            (
              item,
              index
            ) => (

              <tr key={index}>

                <td>
                  {
                    item.itemName
                  }
                </td>

                <td
                  align="center"
                >
                  {item.qty}
                </td>

                <td
                  align="right"
                >
                  $
                  {Number(
                    item.total
                  ).toFixed(2)}
                </td>

              </tr>

            )
          )}

        </tbody>

      </table>

      <hr
        style={{
          borderStyle: "dashed",
        }}
      />

      {/* TOTALS */}

      <div>

        <p>
          Subtotal :
          $
          {Number(
            selectedBill.subtotal
          ).toFixed(2)}
        </p>

        <p>
          {
            selectedBill.taxName
          }
          (
          {
            selectedBill.taxRate
          }
          %) :
          $
          {Number(
            selectedBill.tax
          ).toFixed(2)}
        </p>

        <h2
          style={{
            marginTop: "10px",
          }}
        >
          TOTAL :
          $
          {Number(
            selectedBill.total
          ).toFixed(2)}
        </h2>

      </div>

      <hr
        style={{
          borderStyle: "dashed",
        }}
      />

      {/* FOOTER */}

      <div
        style={{
          textAlign: "center",
          marginTop: "15px",
        }}
      >

        <h3>
          THANK YOU ❤️
        </h3>

        <h3>
          VISIT AGAIN
        </h3>

      </div>

    </div>

  </div>

)}
        </div>

      )}

      {/* HISTORY */}

      {page === "history" && (

  <div className="card-box">

    <h2>
      Daily History
    </h2>
<div
  style={{
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    flexWrap: "wrap",
  }}
>

  <input
    type="date"
    value={reportDate}
    onChange={(e) =>
      setReportDate(
        e.target.value
      )
    }
  />

  <input
    type="month"
    value={reportMonth}
    onChange={(e) =>
      setReportMonth(
        e.target.value
      )
    }
  />

 <input
  type="text"
  placeholder="2026"
  value={reportYear}
  onChange={(e) =>
    setReportYear(e.target.value)
  }
/>

</div>
<div
  style={{
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  }}
>

  <button
    className="save-btn"
    onClick={downloadDailyReport}
  >
    Daily Report
  </button>

  <button
    className="save-btn"
    onClick={downloadMonthlyReport}
  >
    Monthly Report
  </button>

  <button
    className="save-btn"
    onClick={downloadYearlyReport}
  >
    Yearly Report
  </button>

</div>
    



    {/* EMPTY HISTORY */}

    {historyBills.length === 0 && (

      <div
        style={{
          textAlign: "center",
          marginTop: "30px",
        }}
      >

        <h3>
          No History Found
        </h3>

        <p>
          First close today's shift.
        </p>

      </div>

    )}

    {/* HISTORY DATA */}

    {Array.isArray(historyBills) &&
      historyBills.map((day) => (

        <div
          key={day.id}
          className="history-card"
          style={{
            cursor: "pointer",
          }}
          onClick={() => {

            setSelectedDay(
              day.date || ""
            );

            setSelectedDayBills(
              day.bills || []
            );

            setPage(
              "dayDetails"
            );

          }}
        >

          <h3>
            {day.date}
          </h3>

          <p>
            Revenue :
            $
            {Number(
              day.totalRevenue || 0
            ).toFixed(2)}
          </p>

          <p>
            Bills :
            {day.billsCount || 0}
          </p>

        </div>

      ))}

  </div>

)}
      {/* DAY DETAILS */}

      {page === "dayDetails" && (

        <div className="card-box">

          <button
            className="save-btn"
            onClick={() =>
              setPage("history")
            }
          >
            Back
          </button>

          <h2>
            {selectedDay}
          </h2>

          {selectedDayBills.map(
            (bill) => (

              <div
                key={bill.id}
                className="history-card"
                onClick={() => {

                  setSelectedBill(
                    bill
                  );

                  setPage(
                    "billDetails"
                  );

                }}
                style={{
                  cursor: "pointer",
                }}
              >

                <h3>
                  {bill.billNo}
                </h3>

                <p>
                  Customer :
                  {bill.customerName}
                </p>

                <p>
                  Payment :
                  {bill.paymentMethod}
                </p>

                <p>
                  Time :
                  {bill.time}
                </p>

                <p>
                  Total :
                  $
                  {bill.total.toFixed(2)}
                </p>

              </div>

            )
          )}

        </div>

      )}

      {/* BILL DETAILS */}

      {page === "billDetails" && (

        <div className="card-box">

          <button
            className="save-btn"
            onClick={() =>
              setPage("dayDetails")
            }
          >
            Back
          </button>

          <h2>
            {selectedBill?.billNo}
          </h2>

          <h3>
            Customer :
            {selectedBill?.customerName}
          </h3>

          <p>
            Payment :
            {selectedBill?.paymentMethod}
          </p>

          <p>
            Time :
            {selectedBill?.time}
          </p>

        </div>

      )}

    </div>

  );
  

}

export default App;