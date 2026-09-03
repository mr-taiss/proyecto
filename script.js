/* SISGOP - gestion de objetos perdidos */
const STORAGE_KEY="sisgop_objects";
let objects=[],editingId=null,currentFilter="Todos",currentImage="";

const OBJECT_OPTIONS={
  "Prendas":["Chompa","Polera","Pantalón","Falda","Camisa","Chaqueta","Abrigo","Gorra","Medias","Bufanda"],
  "Dispositivos electrónicos":["Celular","Audífonos","Cargador","Tablet","Laptop","Smartwatch","Calculadora electrónica"],
  "Útiles escolares":["Cuaderno","Carpeta","Estuche","Lápiz","Lapicera","Marcador","Regla","Borrador","Tijeras","Colores","Mochila"],
  "Objetos personales":["Billetera","Llaves","Lentes","Botella","Paraguas","Reloj","Accesorio","Documento personal"]
};

document.addEventListener("DOMContentLoaded",()=>{
  loadObjects();
  setToday();
  setupForm();
  setupImagePreview();
  setupObjectSelectors();
  updateAll();
  showScreen("welcomeScreen");
});

function showScreen(id){document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));const s=document.getElementById(id);if(s){s.classList.add("active");window.scrollTo(0,0)}}
function enterSystem(){updateAll();showScreen("homeScreen")}
function returnToWelcome(){showScreen("welcomeScreen")}
function openHome(){updateAll();showScreen("homeScreen")}
function openRegister(){resetForm();showScreen("registerScreen")}
function openSearch(){document.getElementById("searchInput").value="";document.getElementById("searchStatus").value="Todos";searchObjects();showScreen("searchScreen")}
function openObjects(){currentFilter="Todos";document.querySelectorAll(".filter-button").forEach(b=>b.classList.remove("active"));const f=document.querySelector(".filter-button");if(f)f.classList.add("active");renderObjects();showScreen("objectsScreen")}
function openNotifications(){renderNotifications();showScreen("notificationsScreen")}

function loadObjects(){
  const saved=localStorage.getItem(STORAGE_KEY);
  if(!saved){objects=[];return}
  try{
    objects=JSON.parse(saved);
    objects.forEach(o=>{
      if(!o.status||o.status==="Pendiente")o.status="Perdido";
      if(!o.history)o.history=[];
      if(!o.category)o.category=findCategoryByName(o.name)||"";
    });
    saveObjects();
  }catch(e){objects=[]}
}
function saveObjects(){localStorage.setItem(STORAGE_KEY,JSON.stringify(objects))}
function setToday(){const i=document.getElementById("objectDate");if(!i)return;const d=new Date();i.value=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function setupForm(){const f=document.getElementById("objectForm");if(f)f.addEventListener("submit",saveObject)}

function setupObjectSelectors(){
  const category=document.getElementById("objectCategory");
  if(category)category.addEventListener("change",()=>populateObjectNames(category.value));
  populateObjectNames("");
}

function populateObjectNames(category,selectedName=""){
  const select=document.getElementById("objectName");
  if(!select)return;
  const options=OBJECT_OPTIONS[category]||[];
  if(!category){
    select.innerHTML='<option value="">Primero selecciona un tipo de objeto</option>';
    select.disabled=true;
    return;
  }
  select.disabled=false;
  select.innerHTML='<option value="">Selecciona un objeto</option>'+options.map(name=>`<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`).join("");
  if(selectedName && options.includes(selectedName))select.value=selectedName;
}

function findCategoryByName(name){
  for(const category of Object.keys(OBJECT_OPTIONS)){
    if(OBJECT_OPTIONS[category].includes(name))return category;
  }
  return "";
}

function resetForm(){
  const f=document.getElementById("objectForm");
  f.reset();
  editingId=null;
  currentImage="";
  document.getElementById("formTitle").textContent="Registrar objeto";
  populateObjectNames("");
  const p=document.getElementById("imagePreview");
  p.innerHTML="";
  p.classList.remove("visible");
  setToday();
}

function setupImagePreview(){
  const i=document.getElementById("objectImage");
  if(!i)return;
  i.addEventListener("change",function(){
    const file=this.files[0];
    if(!file)return;
    const r=new FileReader();
    r.onload=e=>{
      currentImage=e.target.result;
      const p=document.getElementById("imagePreview");
      p.innerHTML=`<img src="${currentImage}" alt="Vista previa">`;
      p.classList.add("visible");
    };
    r.readAsDataURL(file);
  });
}

function saveObject(e){
  e.preventDefault();
  const status=document.getElementById("objectStatus").value;
  const category=document.getElementById("objectCategory").value;
  const name=document.getElementById("objectName").value.trim();
  const description=document.getElementById("objectDescription").value.trim();
  const date=document.getElementById("objectDate").value;
  const place=document.getElementById("objectPlace").value;
  const student=document.getElementById("studentName").value.trim();

  if(!status||!category||!name||!description||!date||!place){
    showToast("Completa todos los campos obligatorios.","error");
    return;
  }

  if(editingId!==null){
    const o=objects.find(x=>x.id===editingId);
    if(!o)return;
    o.status=status;
    o.category=category;
    o.name=name;
    o.description=description;
    o.date=date;
    o.place=place;
    o.student=student;
    if(currentImage)o.image=currentImage;
    addHistory(o,"Información del objeto editada.");
    saveObjects();
    updateAll();
    showToast("Objeto actualizado correctamente.","success");
    openObjects();
    return;
  }

  const o={id:generateId(),name,category,description,date,place,student,image:currentImage,status,createdAt:new Date().toISOString(),history:[]};
  addHistory(o,`Objeto registrado como ${status}.`);
  objects.push(o);
  saveObjects();
  updateAll();
  showToast("Objeto registrado correctamente.","success");
  resetForm();
  openObjects();
}

function generateId(){if(!objects.length)return"001";return String(Math.max(...objects.map(o=>parseInt(o.id)||0))+1).padStart(3,"0")}
function addHistory(o,message){if(!o.history)o.history=[];o.history.push({message,date:new Date().toLocaleString("es-BO")})}
function updateAll(){updateStatistics();renderObjects();searchObjects();renderNotifications()}
function updateStatistics(){const l=objects.filter(o=>o.status==="Perdido").length,f=objects.filter(o=>o.status==="Encontrado").length,r=objects.filter(o=>o.status==="Recuperado").length;document.getElementById("lostCount").textContent=l;document.getElementById("foundCount").textContent=f;document.getElementById("recoveredCount").textContent=r;const n=f,b=document.getElementById("notificationBadge");b.textContent=n;b.classList.toggle("zero",n===0)}
function statusHTML(s){const c=s==="Perdido"?"perdido":s==="Encontrado"?"encontrado":"recuperado",sym=s==="Perdido"?"•":s==="Encontrado"?"✓":"↗";return `<span class="status ${c}">${sym} ${s}</span>`}
function formatDate(d){if(!d)return"-";const p=d.split("-");return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:d}
function createTableRow(o){let a=`<button class="table-action" onclick="viewDetails('${o.id}')">Ver</button>`;if(o.status==="Perdido")a+=`<button class="table-action found" onclick="markFound('${o.id}')">Encontrado</button>`;if(o.status==="Encontrado")a+=`<button class="table-action recover" onclick="markRecovered('${o.id}')">Recuperado</button>`;a+=`<button class="table-action edit" onclick="editObject('${o.id}')">Editar</button><button class="table-action delete" onclick="deleteObject('${o.id}')">Eliminar</button>`;return `<tr><td>${escapeHTML(o.id)}</td><td><strong>${escapeHTML(o.name)}</strong></td><td>${formatDate(o.date)}</td><td>${escapeHTML(o.place)}</td><td>${statusHTML(o.status)}</td><td>${a}</td></tr>`}
function renderObjects(){const t=document.getElementById("objectsTableBody");if(!t)return;let list=[...objects];if(currentFilter!=="Todos")list=list.filter(o=>o.status===currentFilter);t.innerHTML=list.length?list.map(createTableRow).join(""):`<tr><td colspan="6" class="empty-message">No hay objetos registrados.</td></tr>`}
function filterObjects(f,b){currentFilter=f;document.querySelectorAll(".filter-button").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderObjects()}
function searchObjects(){const i=document.getElementById("searchInput"),s=document.getElementById("searchStatus"),t=document.getElementById("searchTableBody");if(!i||!s||!t)return;const text=i.value.trim().toLowerCase(),selected=s.value;const results=objects.filter(o=>`${o.name} ${o.category||""} ${o.place} ${o.description} ${o.student||""}`.toLowerCase().includes(text)&&(selected==="Todos"||o.status===selected));t.innerHTML=results.length?results.map(createTableRow).join(""):`<tr><td colspan="6" class="empty-message">No se encontraron objetos.</td></tr>`}
function markFound(id){const o=objects.find(x=>x.id===id);if(!o)return;o.status="Encontrado";addHistory(o,"El objeto fue marcado como encontrado.");saveObjects();updateAll();showToast(`"${o.name}" fue marcado como encontrado.` ,"success");viewDetails(id)}
function markRecovered(id){const o=objects.find(x=>x.id===id);if(!o)return;if(o.status!=="Encontrado"){showToast("El objeto debe estar encontrado primero.","error");return}if(!confirm(`¿Confirmas que "${o.name}" fue entregado a su dueño?`))return;o.status="Recuperado";addHistory(o,"El objeto fue entregado a su dueño.");saveObjects();updateAll();showToast(`"${o.name}" fue marcado como recuperado.` ,"success");viewDetails(id)}

function viewDetails(id){
  const o=objects.find(x=>x.id===id);if(!o)return;
  let image=o.image?`<img src="${o.image}" alt="Objeto">`:`<div class="detail-placeholder">◇</div>`,actions="";
  if(o.status==="Perdido")actions+=`<button class="detail-button found" onclick="markFound('${id}')">Marcar encontrado</button>`;
  if(o.status==="Encontrado")actions+=`<button class="detail-button recover" onclick="markRecovered('${id}')">Marcar recuperado</button>`;
  actions+=`<button class="detail-button edit" onclick="editObject('${id}')">Editar</button><button class="detail-button delete" onclick="deleteObject('${id}')">Eliminar</button><button class="detail-button back" onclick="openObjects()">Volver</button>`;
  const h=o.history||[];
  document.getElementById("detailContent").innerHTML=`<div class="detail-grid"><div><div class="detail-image">${image}</div></div><div class="detail-info"><div class="detail-row"><strong>ID</strong><span>${escapeHTML(o.id)}</span></div><div class="detail-row"><strong>Tipo</strong><span>${escapeHTML(o.category||"No especificado")}</span></div><div class="detail-row"><strong>Objeto</strong><span>${escapeHTML(o.name)}</span></div><div class="detail-row"><strong>Descripción</strong><span>${escapeHTML(o.description)}</span></div><div class="detail-row"><strong>Fecha</strong><span>${formatDate(o.date)}</span></div><div class="detail-row"><strong>Lugar</strong><span>${escapeHTML(o.place)}</span></div><div class="detail-row"><strong>Estudiante</strong><span>${escapeHTML(o.student||"No especificado")}</span></div><div class="detail-row"><strong>Estado</strong><span>${statusHTML(o.status)}</span></div></div></div><div class="detail-actions">${actions}</div><div class="history"><h3>Historial del registro</h3>${h.length?h.map(x=>`<div class="history-item">${escapeHTML(x.date)} — ${escapeHTML(x.message)}</div>`).join(""):"Sin historial."}</div>`;
  showScreen("detailScreen");
}

function editObject(id){
  const o=objects.find(x=>x.id===id);if(!o)return;
  editingId=id;
  document.getElementById("formTitle").textContent="Editar objeto";
  document.getElementById("objectStatus").value=o.status==="Recuperado"?"Encontrado":o.status;
  const category=o.category||findCategoryByName(o.name)||"";
  document.getElementById("objectCategory").value=category;
  populateObjectNames(category,o.name);
  document.getElementById("objectDescription").value=o.description;
  document.getElementById("objectDate").value=o.date;
  document.getElementById("objectPlace").value=o.place;
  document.getElementById("studentName").value=o.student||"";
  currentImage=o.image||"";
  if(o.image){const p=document.getElementById("imagePreview");p.innerHTML=`<img src="${o.image}" alt="Objeto">`;p.classList.add("visible")}
  showScreen("registerScreen");
}

function deleteObject(id){const o=objects.find(x=>x.id===id);if(!o)return;if(!confirm(`¿Eliminar "${o.name}"?`))return;objects=objects.filter(x=>x.id!==id);saveObjects();updateAll();showToast("Objeto eliminado.","success");openObjects()}
function renderNotifications(){const c=document.getElementById("notificationsContent");if(!c)return;const found=objects.filter(o=>o.status==="Encontrado");if(!found.length){c.innerHTML=`<div class="content-card"><div class="empty-message">No hay objetos encontrados pendientes de reclamar.</div></div>`;return}c.innerHTML=found.map(o=>`<div class="notification-card"><div class="notification-icon">✓</div><div><h3>Objeto encontrado</h3><p><strong>${escapeHTML(o.name)}</strong> fue encontrado en <strong>${escapeHTML(o.place)}</strong>.</p><p>Fecha: ${formatDate(o.date)}</p><button class="table-action" onclick="viewDetails('${o.id}')">Ver detalles</button><button class="table-action recover" onclick="markRecovered('${o.id}')">Marcar recuperado</button></div></div>`).join("")}
function showToast(m,type=""){const t=document.getElementById("toast");t.textContent=m;t.className=`toast show ${type}`;setTimeout(()=>t.classList.remove("show"),3000)}
function escapeHTML(v){if(v===null||v===undefined)return"";return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}
