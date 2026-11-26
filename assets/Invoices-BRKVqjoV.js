const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/jspdf.es.min-BIrfgv4h.js","assets/index-G1X2fkcT.js","assets/vendor-ui-CQXcIsp4.js","assets/vendor-react-DeYlcy5C.js","assets/vendor-charts-CO5ZVbU6.js","assets/vendor-query-ByaRkcfL.js","assets/vendor-icons-D_hDdctW.js","assets/index-C6fR4Wmg.css"])))=>i.map(i=>d[i]);
import{D as _,b as q,c as le,d as re,B as N,u as Pe,s as De,a as Te,L as j,I as X,S as z,f as L,g as M,h as O,i as k,J as y,_ as K}from"./index-G1X2fkcT.js";import{j as e}from"./vendor-ui-CQXcIsp4.js";import{r as b}from"./vendor-react-DeYlcy5C.js";import{N as Q}from"./NumericField-BK0nyUFf.js";import{a as ne,o as de,s as ze}from"./nativeSharing-D7C3U5Ib.js";import{ac as C,l as Le,P as Z,aj as ee,F as te,D as A,g as Me,a9 as Oe,ag as Ae,O as Fe,ab as _e,z as qe,a3 as se,au as ae}from"./vendor-icons-D_hDdctW.js";import"./vendor-charts-CO5ZVbU6.js";import"./vendor-query-ByaRkcfL.js";const Ee=({open:l,onOpenChange:p,invoice:i,farmName:u="مزارعنا برو",clientPhone:h=""})=>{const[o,s]=b.useState("58mm");if(!i)return null;const r=c=>Math.round(c||0).toLocaleString("en-US"),x=()=>{const c="thermal-print-styles";let f=document.getElementById(c);f||(f=document.createElement("style"),f.id=c,document.head.appendChild(f)),f.innerHTML=`
      @media print {
        @page {
          size: ${o} auto;
          margin: 0mm;
        }
        body * {
          visibility: hidden !important;
        }
        #thermal-receipt-content, #thermal-receipt-content * {
          visibility: visible !important;
        }
        #thermal-receipt-content {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: ${o} !important;
          margin: 0 !important;
          padding: 6px !important;
          background: #ffffff !important;
          color: #000000 !important;
          font-family: 'Courier New', Courier, monospace !important;
          box-shadow: none !important;
        }
      }
    `,window.print()},v=()=>{const c=ne(i,u);de(h,c)};return e.jsx(_,{open:l,onOpenChange:p,children:e.jsxs(q,{className:"max-w-md p-4 rounded-2xl max-h-[90vh] overflow-y-auto",children:[e.jsx(le,{className:"pb-2 border-b border-slate-100 dark:border-slate-800",children:e.jsx(re,{className:"text-sm font-extrabold flex items-center justify-between",children:e.jsxs("span",{className:"flex items-center gap-1.5",children:[e.jsx(C,{className:"w-4 h-4 text-primary"}),e.jsx("span",{children:"معاينة إيصال الطابعة الحرارية (Bluetooth POS)"})]})})}),e.jsxs("div",{className:"flex items-center justify-between bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl text-xs font-bold mt-2",children:[e.jsx("span",{className:"text-slate-500 mr-2",children:"عرض ورق الطابعة:"}),e.jsxs("div",{className:"flex gap-1",children:[e.jsx("button",{type:"button",onClick:()=>s("58mm"),className:`px-3 py-1 rounded-lg transition ${o==="58mm"?"bg-white dark:bg-slate-900 text-primary shadow-xs font-extrabold":"text-slate-500 hover:text-slate-800"}`,children:"58 مم (محمولة)"}),e.jsx("button",{type:"button",onClick:()=>s("80mm"),className:`px-3 py-1 rounded-lg transition ${o==="80mm"?"bg-white dark:bg-slate-900 text-primary shadow-xs font-extrabold":"text-slate-500 hover:text-slate-800"}`,children:"80 مم (كبيرة)"})]})]}),e.jsx("div",{className:"flex justify-center my-3",children:e.jsxs("div",{id:"thermal-receipt-content",style:{width:o==="58mm"?"250px":"320px"},className:"bg-[#fffdf7] text-black border-2 border-dashed border-slate-300 p-3 rounded-lg shadow-inner text-[11px] font-mono leading-tight select-none",dir:"rtl",children:[e.jsxs("div",{className:"text-center pb-2 border-b border-dashed border-black",children:[e.jsx("p",{className:"text-xs font-black tracking-wider",children:u}),e.jsx("p",{className:"text-[10px] text-slate-700 mt-0.5",children:"إيصال مبيعات"}),e.jsxs("p",{className:"text-[9px] text-slate-600 mt-0.5",children:["رقم: #",i.number," • ",i.date]})]}),e.jsxs("div",{className:"py-1.5 border-b border-dashed border-black text-[10px] space-y-0.5",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"العميل:"}),e.jsx("span",{className:"font-bold",children:i.clientName})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"طريقة الدفع:"}),e.jsx("span",{children:i.paymentMethod==="cash"?"نقدي":"آجل"})]})]}),e.jsxs("div",{className:"py-1.5 border-b border-dashed border-black",children:[e.jsxs("div",{className:"flex justify-between font-bold text-[10px] pb-1 border-b border-dotted border-black/40",children:[e.jsx("span",{children:"الصنف"}),e.jsx("span",{children:"الكمية × السعر"}),e.jsx("span",{children:"الإجمالي"})]}),e.jsx("div",{className:"space-y-1 pt-1",children:i.items&&i.items.length>0?i.items.map((c,f)=>e.jsxs("div",{className:"flex justify-between text-[10px]",children:[e.jsx("span",{className:"font-bold",children:c.type}),e.jsxs("span",{className:"text-[9px]",children:[c.quantity," × ",r(c.unitPrice)]}),e.jsx("span",{className:"font-bold",children:r(c.total)})]},f)):e.jsx("p",{className:"text-center text-[9px] py-1",children:"لا توجد بنود"})})]}),e.jsx("div",{className:"py-2 space-y-1 text-xs font-black border-b border-dashed border-black",children:e.jsxs("div",{className:"flex justify-between text-sm",children:[e.jsx("span",{children:"المجموع النهائي:"}),e.jsxs("span",{children:[r(i.totalAmount)," ج.م"]})]})}),e.jsxs("div",{className:"text-center pt-2 text-[9px] text-slate-700 space-y-0.5",children:[e.jsx("p",{children:"شكراً لتعاملكم معنا"}),e.jsx("p",{className:"text-[8px] text-slate-500",children:"مزارعنا برو - المنظومة المحاسبية"}),e.jsx("p",{className:"text-[8px] font-mono tracking-widest text-slate-400 mt-1",children:"*** نهاية الإيصال ***"})]})]})}),e.jsxs("div",{className:"flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800",children:[e.jsxs(N,{type:"button",onClick:x,className:"flex-1 bg-slate-900 hover:bg-black text-white text-xs font-bold gap-1.5 rounded-xl h-10",children:[e.jsx(C,{className:"w-4 h-4"}),e.jsx("span",{children:"طباعة الإيصال الحراري"})]}),e.jsxs(N,{type:"button",onClick:v,variant:"outline",className:"bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 text-xs font-bold gap-1.5 rounded-xl h-10",children:[e.jsx(Le,{className:"w-4 h-4 text-emerald-600"}),e.jsx("span",{children:"واتساب"})]})]})]})})};function We(l){if(l=Math.round(Number(l)||0),l===0)return"صفر جنيه مصري";const p=["","واحد","اثنان","ثلاثة","أربعة","خمسة","ستة","سبعة","ثمانية","تسعة","عشرة","أحد عشر","اثنا عشر","ثلاثة عشر","أربعة عشر","خمسة عشر","ستة عشر","سبعة عشر","ثمانية عشر","تسعة عشر"],i=["","","عشرون","ثلاثون","أربعون","خمسون","ستون","سبعون","ثمانون","تسعون"],u=["","مائة","مئتان","ثلاثمائة","أربعمائة","خمسمائة","ستمائة","سبعمائة","ثمانمائة","تسعمائة"];function h(o){let s="";const r=Math.floor(o/100),x=o%100;if(r>0&&(s+=u[r],x>0&&(s+=" و ")),x>0)if(x<20)s+=p[x];else{const v=x%10,c=Math.floor(x/10);v>0&&(s+=p[v]+" و "),s+=i[c]}return s}if(l<1e3)return`فقط ${h(l)} جنيه مصري لا غير`;if(l<1e6){const o=Math.floor(l/1e3),s=l%1e3;let r="";o===1?r="ألف":o===2?r="ألفان":o>=3&&o<=10?r=`${h(o)} آلاف`:r=`${h(o)} ألف`;let x=`فقط ${r}`;return s>0&&(x+=` و ${h(s)}`),`${x} جنيه مصري لا غير`}return`فقط ${l.toLocaleString()} جنيه مصري لا غير`}function F(l,p,i=!1){const u=p?.name||"مزارعنا برو للإنتاج الداجني والحيواني",h=p?.location||"جمهورية مصر العربية",o=Array.isArray(l.items)?l.items:[],s=We(l.totalAmount||0);return`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>فاتورة رقم #${l.number||l.id}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: ${i?"15mm 12mm":"20px"};
      font-family: 'Cairo', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      direction: rtl;
      text-align: right;
      color: #0f172a;
      background: #ffffff;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #cbd5e1;
      border-radius: 16px;
      padding: 24px;
      background: #ffffff;
      box-shadow: ${i?"none":"0 10px 25px -5px rgba(0, 0, 0, 0.05)"};
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #162C56;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .brand-box {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .brand-logo {
      width: 64px;
      height: 64px;
      border-radius: 12px;
      object-fit: cover;
      border: 1px solid #e2e8f0;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 800;
      color: #162C56;
      margin: 0 0 4px 0;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #64748b;
      margin: 0;
    }
    .invoice-badge-box {
      text-align: left;
      direction: ltr;
    }
    .invoice-title {
      display: inline-block;
      font-size: 14px;
      font-weight: 800;
      background: #162C56;
      color: #ffffff;
      padding: 5px 14px;
      border-radius: 8px;
      margin-bottom: 6px;
    }
    .meta-text {
      font-size: 11px;
      color: #475569;
      margin: 2px 0;
      font-weight: 600;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 20px;
    }
    .info-panel {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 14px;
    }
    .panel-header {
      font-size: 12px;
      font-weight: 700;
      color: #162C56;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      margin-bottom: 4px;
    }
    .info-label {
      color: #64748b;
      font-weight: 600;
    }
    .info-val {
      color: #0f172a;
      font-weight: 700;
    }
    table.invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 11px;
    }
    table.invoice-table th {
      background: #162C56;
      color: #ffffff;
      padding: 9px 10px;
      text-align: right;
      font-weight: 700;
      border: 1px solid #162C56;
    }
    table.invoice-table th.center, table.invoice-table td.center {
      text-align: center;
    }
    table.invoice-table th.left, table.invoice-table td.left {
      text-align: left;
    }
    table.invoice-table td {
      padding: 9px 10px;
      border: 1px solid #cbd5e1;
      color: #1e293b;
    }
    table.invoice-table tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    .summary-section {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 24px;
    }
    .tafqeet-box {
      flex: 1;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 11px;
      line-height: 1.6;
    }
    .tafqeet-title {
      font-weight: 700;
      color: #162C56;
      margin-bottom: 4px;
    }
    .totals-box {
      width: 280px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      overflow: hidden;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      font-size: 11px;
      border-bottom: 1px solid #f1f5f9;
    }
    .total-row.grand {
      background: #162C56;
      color: #ffffff;
      font-size: 13px;
      font-weight: 800;
      border-bottom: none;
    }
    .signatures-block {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 18px;
      border-top: 1px dashed #cbd5e1;
      margin-top: 10px;
    }
    .signature-item {
      text-align: center;
      width: 190px;
    }
    .sig-title {
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      margin-bottom: 35px;
    }
    .sig-line {
      border-bottom: 1px solid #94a3b8;
      width: 140px;
      margin: 0 auto;
    }
    .stamp-seal {
      width: 90px;
      height: 90px;
      border: 2px dashed #162C56;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #162C56;
      font-size: 10px;
      font-weight: 800;
      transform: rotate(-10deg);
      opacity: 0.85;
      margin: 0 auto;
    }
    .footer-note {
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      margin-top: 20px;
      border-top: 1px solid #f1f5f9;
      padding-top: 10px;
    }
    @media print {
      body {
        padding: 0;
        background: #ffffff;
      }
      .invoice-card {
        border: none;
        box-shadow: none;
        padding: 0;
      }
      @page {
        size: A4 portrait;
        margin: 12mm;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <!-- Header -->
    <div class="header-bar">
      <div class="brand-box">
        <img src="/mazareana-pro/logo.png" alt="الشعار" class="brand-logo" onerror="this.style.display='none'" />
        <div>
          <h1 class="brand-title">${u}</h1>
          <p class="brand-subtitle">سجل تجاري وبطاقة ضريبية معتمدة • ${h}</p>
          <p class="brand-subtitle">المنظومة المالية وإدارة الإنتاج الحيواني المتكاملة</p>
        </div>
      </div>
      <div class="invoice-badge-box">
        <div class="invoice-title">فاتورة ${l.type==="شراء"?"مشتريات":"مبيعات"} رسمية</div>
        <div class="meta-text"><strong>رقم الفاتورة:</strong> #${l.number||"INV-001"}</div>
        <div class="meta-text"><strong>التاريخ:</strong> ${l.date||new Date().toISOString().split("T")[0]}</div>
        <div class="meta-text"><strong>الحالة:</strong> ${l.status||"مدفوعة"}</div>
      </div>
    </div>

    <!-- Client & Order Info -->
    <div class="info-grid">
      <div class="info-panel">
        <div class="panel-header">بيانات ${l.type==="شراء"?"المورد":"العميل"}</div>
        <div class="info-row">
          <span class="info-label">الاسم:</span>
          <span class="info-val">${l.clientName||"عميل نقدي"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">طريقة السداد:</span>
          <span class="info-val">${l.paymentMethod||"نقدي"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">حالة الدفع:</span>
          <span class="info-val" style="color: ${l.status==="مدفوعة"?"#15803d":"#b91c1c"}">
            ${l.status==="مدفوعة"?"✅ مسددة بالكامل":"⏳ آجل غير مسدد"}
          </span>
        </div>
      </div>

      <div class="info-panel">
        <div class="panel-header">تفاصيل العملية</div>
        <div class="info-row">
          <span class="info-label">نوع المعاملة:</span>
          <span class="info-val">${l.type==="شراء"?"توريد مستلزمات / مشتريات":"بيع وتسليم منتجات"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">المزرعة:</span>
          <span class="info-val">${u}</span>
        </div>
        <div class="info-row">
          <span class="info-label">تاريخ الاستخراج:</span>
          <span class="info-val">${new Date().toLocaleDateString("ar-EG")}</span>
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <table class="invoice-table">
      <thead>
        <tr>
          <th class="center" style="width: 38px;">م</th>
          <th>البيان / الصنف</th>
          <th class="center" style="width: 80px;">الكمية</th>
          <th class="center" style="width: 120px;">سعر الوحدة</th>
          <th class="left" style="width: 130px;">الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${o.map((r,x)=>`
          <tr>
            <td class="center" style="font-weight:bold;">${x+1}</td>
            <td style="font-weight:700;">${r.type||"بند مالي"}</td>
            <td class="center" style="font-weight:bold;">${Number(r.quantity||1).toLocaleString()}</td>
            <td class="center">${Number(r.unitPrice||0).toLocaleString()} ج.م</td>
            <td class="left" style="font-weight:800; color:#162C56;">${Number(r.total||r.quantity*r.unitPrice).toLocaleString()} ج.م</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <!-- Totals & Tafqeet -->
    <div class="summary-section">
      <div class="tafqeet-box">
        <div class="tafqeet-title">المبلغ بالحروف العربية:</div>
        <div style="font-weight:800; color:#162C56; font-size:12px; margin-bottom: 6px;">${s}</div>
        <div style="color: #64748b; font-size: 10px;">
          * استلمت أنا الموقع أدناه البضاعة المبينة أعلاه بحالة جيدة وسليمة مطابقة للمواصفات المتفق عليها.
        </div>
      </div>

      <div class="totals-box">
        <div class="total-row">
          <span style="color:#64748b;">إجمالي البنود:</span>
          <span style="font-weight:bold;">${Number(l.totalAmount||0).toLocaleString()} ج.م</span>
        </div>
        <div class="total-row">
          <span style="color:#64748b;">الخصم:</span>
          <span style="font-weight:bold;">0 ج.م</span>
        </div>
        <div class="total-row grand">
          <span>الصافي النهائي:</span>
          <span>${Number(l.totalAmount||0).toLocaleString()} ج.م</span>
        </div>
      </div>
    </div>

    <!-- Signatures -->
    <div class="signatures-block">
      <div class="signature-item">
        <div class="sig-title">توقيع المستلم / العميل</div>
        <div class="sig-line"></div>
      </div>

      <div class="stamp-seal">
        <div>مزارعنا برو</div>
        <div style="font-size:8px; margin: 2px 0;">★ معتمد رسمياً ★</div>
        <div>الإدارة المالية</div>
      </div>

      <div class="signature-item">
        <div class="sig-title">توقيع المحاسب / الإدارة</div>
        <div class="sig-line"></div>
      </div>
    </div>

    <div class="footer-note">
      شكراً لتعاملكم معنا • تم إصدار هذه الفاتورة إلكترونياً عبر منظومة Mazareana Pro لإدارة المزارع والإنتاج الحيواني
    </div>
  </div>
</body>
</html>
  `.trim()}function Ze(){const{invoices:l,clients:p,addInvoice:i,updateInvoice:u,deleteInvoice:h,currentFarm:o}=Pe(),[s,r]=b.useState({clientName:"",type:"بيع",date:new Date().toISOString().split("T")[0],paymentMethod:"نقدي",items:[{type:"بيض",quantity:1,unitPrice:0}]}),[x,v]=b.useState(!1),[c,f]=b.useState(""),[S,oe]=b.useState("all"),[I,ie]=b.useState("all"),[g,ce]=b.useState(null),[xe,$]=b.useState(!1),[E,W]=b.useState(!1),[V,H]=b.useState(null),[me,P]=b.useState(!1),pe=()=>{if(s.clientName&&s.type&&s.date){const t=s.items.reduce((a,d)=>a+d.quantity*d.unitPrice,0),n=l.length+1;`${String(n).padStart(4,"0")}`,i({...s,totalAmount:t,status:s.paymentMethod==="نقدي"?"مدفوعة":"غير مدفوعة",items:s.items.map(a=>({...a,total:a.quantity*a.unitPrice}))}),r({clientName:"",type:"بيع",date:new Date().toISOString().split("T")[0],paymentMethod:"نقدي",items:[{type:"بيض",quantity:1,unitPrice:0}]}),v(!1),y.success("تم إنشاء الفاتورة بنجاح!")}else y.error("يرجى ملء جميع الحقول المطلوبة (اسم العميل، النوع، والتاريخ)")},R=t=>{try{const n=F(t,o,!0),a=document.createElement("iframe");a.style.position="fixed",a.style.right="0",a.style.bottom="0",a.style.width="0",a.style.height="0",a.style.border="0",document.body.appendChild(a);const d=a.contentWindow?.document;d&&(d.open(),d.write(n),d.close(),setTimeout(()=>{try{a.contentWindow?.focus(),a.contentWindow?.print(),setTimeout(()=>{document.body.contains(a)&&document.body.removeChild(a)},2e3)}catch{const m=window.open("","_blank");m&&(m.document.write(n),m.document.close(),m.focus(),m.print())}},400))}catch(n){console.error(n),y.error("حدث خطأ أثناء إعداد الفاتورة للطباعة")}},U=async t=>{W(!0);try{const[{default:n},{default:a}]=await Promise.all([K(()=>import("./jspdf.es.min-BIrfgv4h.js").then($e=>$e.j),__vite__mapDeps([0,1,2,3,4,5,6,7])),K(()=>import("./html2canvas.esm-BfxBtG_O.js"),[])]);document.fonts&&await document.fonts.ready;const d=document.createElement("div");d.setAttribute("dir","rtl"),d.style.position="fixed",d.style.left="0",d.style.top="0",d.style.zIndex="99999",d.style.opacity="1",d.style.visibility="visible",d.style.width="794px",d.style.background="#ffffff",d.innerHTML=F(t,o,!1),document.body.appendChild(d);const m=await a(d,{scale:2,useCORS:!0,allowTaint:!0,logging:!1,backgroundColor:"#ffffff",windowWidth:794,x:0,y:0,scrollX:0,scrollY:0}),T=m.toDataURL("image/jpeg",.98),w=new n({orientation:"portrait",unit:"mm",format:"a4"}),G=w.internal.pageSize.getWidth(),Ce=m.width,Se=m.height*G/Ce;w.addImage(T,"JPEG",0,0,G,Se);const Y=`فاتورة_${t.number||t.id}_${t.clientName||"عميل"}.pdf`,Ie=w.output("datauristring").split(",")[1];await ze(Y,Ie,()=>{w.save(Y),y.success("تم تصدير الفاتورة بنجاح!")}),document.body.removeChild(d)}catch(n){console.error("Error generating PDF:",n),y.error("حدث خطأ أثناء تصدير ملف PDF للفاتورة")}finally{W(!1)}},B=t=>{const n=p.find(d=>d.name===t.clientName),a=ne(t,o?.name||"مزارعنا برو");de(n?.phone,a)},be=t=>{ce(t),$(!0)},he=t=>{window.confirm("هل أنت متأكد من حذف هذه الفاتورة؟")&&(h(t),y.success("تم حذف الفاتورة بنجاح"),g?.id===t&&$(!1))},fe=p.map(t=>t.name),ue=["بيض","فراخ","سبلة","علف","دواء","أخرى"],ge=["نقدي","آجل","شيك","تحويل بنكي"],je=()=>{r({...s,items:[...s.items,{type:"بيض",quantity:1,unitPrice:0}]})},D=(t,n,a)=>{const d=s.items.map((m,T)=>T===t?{...m,[n]:a}:m);r({...s,items:d})},ve=t=>{if(s.items.length<=1){y.error("يجب أن تحتوي الفاتورة على بند واحد على الأقل");return}r({...s,items:s.items.filter((n,a)=>a!==t)})},J=l.filter(t=>{const n=(t.clientName||"").toLowerCase().includes(c.toLowerCase())||(t.number||"").toLowerCase().includes(c.toLowerCase()),a=S==="all"||t.type===S,d=I==="all"||t.status===I;return n&&a&&d}).sort(De),ye=l.length,Ne=l.filter(t=>t.status==="مدفوعة").length,we=l.filter(t=>t.status==="غير مدفوعة").length,ke=l.reduce((t,n)=>t+(n.totalAmount||0),0);return e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",children:[e.jsxs("div",{children:[e.jsxs("h1",{className:"text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2",children:[e.jsx("span",{children:"🧾"}),e.jsx("span",{children:"الفواتير وسندات القبض"})]}),e.jsx("p",{className:"text-xs text-slate-500 dark:text-slate-400",children:"إصدار وطباعة فواتير البيع والشراء الرسمية ومزامنتها مع العملاء"})]}),e.jsxs(_,{open:x,onOpenChange:v,children:[e.jsx(Te,{asChild:!0,children:e.jsxs(N,{className:"bg-[#162C56] hover:bg-[#1f3c73] text-white rounded-xl shadow-xs text-xs font-bold w-full sm:w-auto h-9",children:[e.jsx(Z,{className:"h-4 w-4 ml-1.5"}),e.jsx("span",{children:"إنشاء فاتورة جديدة"})]})}),e.jsxs(q,{className:"max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl",children:[e.jsx(le,{children:e.jsxs(re,{className:"text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-white",children:[e.jsx("span",{children:"🧾"}),e.jsx("span",{children:"إنشاء فاتورة رسمية جديدة"})]})}),e.jsxs("div",{className:"space-y-3.5 pt-1",children:[e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[e.jsxs("div",{children:[e.jsx(j,{htmlFor:"clientName",className:"text-xs font-bold",children:"اسم العميل / المورد"}),e.jsx(X,{id:"clientName",list:"clients",value:s.clientName,onChange:t=>r({...s,clientName:t.target.value}),placeholder:"اختر أو اكتب الاسم",className:"mt-1 rounded-xl text-xs"}),e.jsx("datalist",{id:"clients",children:fe.map(t=>e.jsx("option",{value:t},t))})]}),e.jsxs("div",{children:[e.jsx(j,{htmlFor:"type",className:"text-xs font-bold",children:"نوع الفاتورة"}),e.jsxs(z,{value:s.type,onValueChange:t=>r({...s,type:t}),children:[e.jsx(L,{className:"mt-1 rounded-xl text-xs",children:e.jsx(M,{placeholder:"اختر النوع"})}),e.jsxs(O,{children:[e.jsx(k,{value:"بيع",children:"فاتورة بيع (تسليم مبيعات)"}),e.jsx(k,{value:"شراء",children:"فاتورة شراء (توريد مشتريات)"})]})]})]})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[e.jsxs("div",{children:[e.jsx(j,{htmlFor:"date",className:"text-xs font-bold",children:"تاريخ الفاتورة"}),e.jsx(X,{id:"date",type:"date",value:s.date,onChange:t=>r({...s,date:t.target.value}),className:"mt-1 rounded-xl text-xs"})]}),e.jsxs("div",{children:[e.jsx(j,{htmlFor:"paymentMethod",className:"text-xs font-bold",children:"طريقة السداد"}),e.jsxs(z,{value:s.paymentMethod,onValueChange:t=>r({...s,paymentMethod:t}),children:[e.jsx(L,{className:"mt-1 rounded-xl text-xs",children:e.jsx(M,{placeholder:"اختر طريقة الدفع"})}),e.jsx(O,{children:ge.map(t=>e.jsx(k,{value:t,children:t},t))})]})]})]}),e.jsxs("div",{className:"pt-2 border-t border-slate-100 dark:border-slate-800",children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsx(j,{className:"text-xs font-extrabold text-slate-800 dark:text-slate-200",children:"بنود الفاتورة"}),e.jsxs(N,{type:"button",onClick:je,variant:"outline",size:"sm",className:"h-7 text-xs rounded-lg",children:[e.jsx(Z,{className:"h-3 w-3 ml-1"}),"إضافة بند"]})]}),e.jsx("div",{className:"space-y-2",children:s.items.map((t,n)=>e.jsxs("div",{className:"p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-2 sm:items-center",children:[e.jsxs("div",{className:"sm:col-span-4",children:[e.jsx(j,{className:"text-[10px] text-slate-400 sm:hidden",children:"الصنف"}),e.jsxs(z,{value:t.type,onValueChange:a=>D(n,"type",a),children:[e.jsx(L,{className:"h-8 text-xs rounded-lg",children:e.jsx(M,{placeholder:"الصنف"})}),e.jsx(O,{children:ue.map(a=>e.jsx(k,{value:a,children:a},a))})]})]}),e.jsxs("div",{className:"sm:col-span-3",children:[e.jsx(j,{className:"text-[10px] text-slate-400 sm:hidden",children:"الكمية"}),e.jsx(Q,{placeholder:"الكمية",value:t.quantity,onChangeNumber:a=>D(n,"quantity",a),className:"h-8 text-xs rounded-lg"})]}),e.jsxs("div",{className:"sm:col-span-3",children:[e.jsx(j,{className:"text-[10px] text-slate-400 sm:hidden",children:"السعر"}),e.jsx(Q,{placeholder:"السعر",value:t.unitPrice,onChangeNumber:a=>D(n,"unitPrice",a),className:"h-8 text-xs rounded-lg"})]}),e.jsxs("div",{className:"flex items-center justify-between sm:justify-end gap-2 sm:col-span-2",children:[e.jsxs("span",{className:"text-xs font-bold text-[#162C56] dark:text-blue-400",children:[(t.quantity*t.unitPrice).toLocaleString()," ج.م"]}),s.items.length>1&&e.jsx("button",{type:"button",onClick:()=>ve(n),className:"text-rose-500 hover:text-rose-700 p-1 rounded-md",children:e.jsx(ee,{className:"w-3.5 h-3.5"})})]})]},n))}),e.jsxs("div",{className:"mt-3 p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900 flex justify-between items-center",children:[e.jsx("span",{className:"text-xs font-bold text-slate-700 dark:text-slate-300",children:"الإجمالي النهائي:"}),e.jsxs("span",{className:"text-sm font-extrabold text-[#162C56] dark:text-blue-400",children:[s.items.reduce((t,n)=>t+n.quantity*n.unitPrice,0).toLocaleString()," جنيه مصري"]})]})]}),e.jsx(N,{onClick:pe,className:"w-full bg-[#162C56] hover:bg-[#1f3c73] text-white rounded-xl text-xs font-bold h-10 mt-2",children:"حفظ وإصدار الفاتورة"})]})]})]})]}),e.jsxs("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-2.5",children:[e.jsx("div",{className:"bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700 shadow-2xs",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-[10px] font-bold text-slate-400",children:"إجمالي الفواتير"}),e.jsx("p",{className:"text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-0.5",children:ye})]}),e.jsx("div",{className:"w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400",children:e.jsx(te,{className:"h-4 w-4"})})]})}),e.jsx("div",{className:"bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700 shadow-2xs",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-[10px] font-bold text-slate-400",children:"مجموع المبالغ"}),e.jsxs("p",{className:"text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5",children:[ke.toLocaleString()," ج.م"]})]}),e.jsx("div",{className:"w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400",children:e.jsx(A,{className:"h-4 w-4"})})]})}),e.jsx("div",{className:"bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700 shadow-2xs",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-[10px] font-bold text-slate-400",children:"فواتير مسددة"}),e.jsx("p",{className:"text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5",children:Ne})]}),e.jsx("div",{className:"w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400",children:e.jsx(Me,{className:"h-4 w-4"})})]})}),e.jsx("div",{className:"bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700 shadow-2xs",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-[10px] font-bold text-slate-400",children:"فواتير غير مسددة"}),e.jsx("p",{className:"text-base sm:text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-0.5",children:we})]}),e.jsx("div",{className:"w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400",children:e.jsx(Oe,{className:"h-4 w-4"})})]})})]}),e.jsx("div",{className:"bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700 shadow-2xs",children:e.jsxs("div",{className:"flex flex-col sm:flex-row gap-2.5 sm:items-center",children:[e.jsxs("div",{className:"flex-1 relative",children:[e.jsx(Ae,{className:"absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"}),e.jsx("input",{type:"text",value:c,onChange:t=>f(t.target.value),placeholder:"البحث برقم الفاتورة أو اسم العميل...",className:"w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"})]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsxs("select",{value:S,onChange:t=>oe(t.target.value),className:"bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none",children:[e.jsx("option",{value:"all",children:"كل الأنواع"}),e.jsx("option",{value:"بيع",children:"فواتير بيع"}),e.jsx("option",{value:"شراء",children:"فواتير شراء"})]}),e.jsxs("select",{value:I,onChange:t=>ie(t.target.value),className:"bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none",children:[e.jsx("option",{value:"all",children:"كل الحالات"}),e.jsx("option",{value:"مدفوعة",children:"مسددة"}),e.jsx("option",{value:"غير مدفوعة",children:"غير مسددة"})]})]})]})}),e.jsx("div",{className:"space-y-2.5",children:J.length===0?e.jsxs("div",{className:"bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-slate-200/80 dark:border-slate-700 shadow-2xs",children:[e.jsx("span",{className:"text-3xl block mb-2",children:"🧾"}),e.jsx("p",{className:"text-xs font-bold text-slate-700 dark:text-slate-300",children:"لا توجد فواتير مطابقة للبحث"}),e.jsx("p",{className:"text-[11px] text-slate-400 mt-0.5",children:"يمكنك إنشاء فاتورة جديدة بسهولة باستخدام الزر بالأعلى"})]}):J.map(t=>e.jsx("div",{className:"bg-white dark:bg-slate-800 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700 shadow-2xs hover:border-blue-300 dark:hover:border-slate-600 transition",children:e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",children:[e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.type==="بيع"?"bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800":"bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"}`,children:e.jsx(te,{className:"h-5 w-5"})}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2 flex-wrap",children:[e.jsxs("span",{className:"text-xs font-extrabold text-slate-900 dark:text-white",children:["#",t.number||"INV"]}),e.jsx("span",{className:`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.type==="بيع"?"bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300":"bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300"}`,children:t.type==="بيع"?"مبيعات":"مشتريات"}),e.jsx("span",{className:`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.status==="مدفوعة"?"bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800":"bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"}`,children:t.status==="مدفوعة"?"مسددة":"آجل"})]}),e.jsxs("p",{className:"text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1.5",children:[e.jsx(Fe,{className:"w-3.5 h-3.5 text-slate-400"}),e.jsx("span",{children:t.clientName||"عميل نقدي"}),e.jsxs("span",{className:"text-slate-400 text-[10px] font-normal",children:["(",t.paymentMethod||"نقدي",")"]})]}),e.jsxs("p",{className:"text-[10px] text-slate-400 mt-0.5 flex items-center gap-1",children:[e.jsx(_e,{className:"w-3 h-3 text-slate-400"}),e.jsx("span",{children:t.date}),e.jsx("span",{className:"mx-1",children:"•"}),e.jsxs("span",{children:[Array.isArray(t.items)?t.items.length:1," بنود"]})]})]})]}),e.jsxs("div",{className:"flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700/60",children:[e.jsxs("div",{className:"text-right sm:text-left",children:[e.jsx("span",{className:"text-[10px] text-slate-400 block font-medium",children:"المبلغ الإجمالي"}),e.jsxs("span",{className:"text-sm font-extrabold text-[#162C56] dark:text-blue-400",children:[Number(t.totalAmount||0).toLocaleString()," ج.م"]})]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsxs("button",{onClick:()=>be(t),className:"bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 p-2 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-800 flex items-center gap-1 transition",title:"معاينة الفاتورة الرسمية",children:[e.jsx(qe,{className:"w-3.5 h-3.5"}),e.jsx("span",{className:"hidden md:inline",children:"معاينة"})]}),e.jsx("button",{onClick:()=>R(t),className:"bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 p-2 rounded-xl text-xs font-bold transition",title:"طباعة الفاتورة",children:e.jsx(C,{className:"w-3.5 h-3.5"})}),e.jsx("button",{onClick:()=>{H(t),P(!0)},className:"bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-700 dark:text-amber-300 p-2 rounded-xl text-xs font-bold border border-amber-200 dark:border-amber-800 transition",title:"طباعة إيصال حراري (بلوتوث/POS)",children:e.jsx(se,{className:"w-3.5 h-3.5"})}),e.jsx("button",{onClick:()=>U(t),className:"bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 p-2 rounded-xl text-xs font-bold transition",title:"تصدير PDF",children:e.jsx(A,{className:"w-3.5 h-3.5"})}),e.jsx("button",{onClick:()=>B(t),className:"bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 p-2 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition",title:"مشاركة عبر واتساب",children:e.jsx(ae,{className:"w-3.5 h-3.5"})}),e.jsx("button",{onClick:()=>he(t.id),className:"text-slate-400 hover:text-rose-600 p-2 rounded-xl transition",title:"حذف الفاتورة",children:e.jsx(ee,{className:"w-3.5 h-3.5"})})]})]})]})},t.id))}),e.jsx(_,{open:xe,onOpenChange:$,children:e.jsx(q,{className:"max-w-3xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-2xl",children:g&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-3",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-xl",children:"🧾"}),e.jsxs("div",{children:[e.jsxs("h3",{className:"text-sm font-extrabold text-slate-900 dark:text-white",children:["معاينة الفاتورة الرسمية (#",g.number||"INV",")"]}),e.jsx("p",{className:"text-[11px] text-slate-400",children:"جاهزة للطباعة والتصدير والمشاركة"})]})]}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsxs("button",{onClick:()=>R(g),className:"bg-[#162C56] hover:bg-[#1f3c73] text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95",children:[e.jsx(C,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"طباعة"})]}),e.jsxs("button",{onClick:()=>{H(g),P(!0)},className:"bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95",children:[e.jsx(se,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"إيصال حراري"})]}),e.jsxs("button",{onClick:()=>U(g),disabled:E,className:"bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95",children:[e.jsx(A,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:E?"جاري التصدير...":"تحميل PDF"})]}),e.jsxs("button",{onClick:()=>B(g),className:"bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95",children:[e.jsx(ae,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"واتساب"})]})]})]}),e.jsx("div",{className:"bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-sm text-slate-900",dangerouslySetInnerHTML:{__html:F(g,o,!1)}})]})})}),e.jsx(Ee,{open:me,onOpenChange:P,invoice:V,farmName:o?.name,clientPhone:p.find(t=>t.name===V?.clientName)?.phone})]})}export{Ze as default};
