/* Prototipo funcional: Hábitat Inmobiliaria
   Lógica común: favoritos (localStorage), tarjetas, utilidades y cada página. */

/* ---------- Utilidades ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const cop = (n) => "$" + n.toLocaleString("es-CO");
const precioTxt = (i) => cop(i.precio) + (i.operacion === "arriendo" ? " / mes" : "");
const fechaTxt = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
const porId = (id) => INMUEBLES.find((i) => i.id === Number(id));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------- Favoritos ---------- */
const KEY = "habitat_favoritos";
const favoritos = {
  leer() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return this._mem || []; } },
  guardar(lista) { try { localStorage.setItem(KEY, JSON.stringify(lista)); } catch (e) { this._mem = lista; } },
  tiene(id) { return this.leer().includes(Number(id)); },
  alternar(id) {
    id = Number(id);
    const l = this.leer();
    const nueva = l.includes(id) ? l.filter((x) => x !== id) : [...l, id];
    this.guardar(nueva);
    return nueva.includes(id);
  },
};

function actualizarContador() {
  const n = favoritos.leer().length;
  $$("[data-fav-count]").forEach((el) => { el.textContent = n; });
  $$("[data-fav-badge]").forEach((el) => { el.hidden = n === 0; });
}

let anuncioTimer;
function anunciar(msg) {
  const el = $("#anuncio");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("visible");
  clearTimeout(anuncioTimer);
  anuncioTimer = setTimeout(() => el.classList.remove("visible"), 2600);
}

function pintarBotonFav(btn, activo) {
  btn.setAttribute("aria-pressed", activo ? "true" : "false");
  const titulo = btn.dataset.titulo || "inmueble";
  btn.setAttribute("aria-label", (activo ? "Quitar de favoritos: " : "Guardar en favoritos: ") + titulo);
  const txt = btn.querySelector(".fav-txt");
  if (txt) txt.textContent = activo ? "Guardado" : "Guardar";
}

function enlazarFavoritos(root = document, onChange) {
  $$("[data-fav]", root).forEach((btn) => {
    pintarBotonFav(btn, favoritos.tiene(btn.dataset.fav));
    btn.addEventListener("click", () => {
      const activo = favoritos.alternar(btn.dataset.fav);
      pintarBotonFav(btn, activo);
      actualizarContador();
      anunciar(activo ? "Inmueble guardado en favoritos." : "Inmueble quitado de favoritos.");
      if (onChange) onChange(btn.dataset.fav, activo);
    });
  });
}

/* ---------- Componentes ---------- */
function imgHtml(i, clase = "") {
  const hue = (i.id * 47) % 360;
  return `<div class="thumb ${clase}" style="--h:${hue}" role="img" aria-label="Imagen ilustrativa de ${i.tipo} en ${i.barrio}">
    <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 32 32 10l24 22v22H40V38H24v16H8z" fill="currentColor"/></svg></div>`;
}

function tarjetaHtml(i) {
  return `<article class="card" data-id="${i.id}">
    <a class="card-link" href="inmueble.html?id=${i.id}" aria-label="Ver detalle: ${i.titulo}">${imgHtml(i)}</a>
    <div class="card-body">
      <p class="tag">${cap(i.tipo)} en ${i.operacion}</p>
      <h3><a href="inmueble.html?id=${i.id}">${i.titulo}</a></h3>
      <p class="price">${precioTxt(i)}</p>
      <p class="loc">${i.barrio}, ${i.ciudad}</p>
      <ul class="feat" aria-label="Características">
        <li>${i.hab} hab.</li><li>${i.banos} baños</li><li>${i.area} m²</li><li>${i.parq ? i.parq + " parq." : "Sin parq."}</li>
      </ul>
      <p class="upd">Actualizado el ${fechaTxt(i.actualizado)}</p>
      <button type="button" class="btn-fav" data-fav="${i.id}" data-titulo="${i.titulo}" aria-pressed="false">
        <span aria-hidden="true" class="heart">♥</span><span class="fav-txt">Guardar</span>
      </button>
    </div>
  </article>`;
}

function opcionesCiudad(select, todas = true) {
  select.innerHTML = (todas ? '<option value="">Todas las ciudades</option>' : "") +
    CIUDADES.map((c) => `<option>${c}</option>`).join("");
}

/* ---------- Navegación común ---------- */
function initNav() {
  const btn = $("#menu-btn");
  const nav = $("#nav-principal");
  if (btn && nav) {
    btn.addEventListener("click", () => {
      const abierto = nav.classList.toggle("abierto");
      btn.setAttribute("aria-expanded", abierto ? "true" : "false");
    });
  }
  const actual = location.pathname.split("/").pop() || "index.html";
  $$("#nav-principal a").forEach((a) => {
    const href = a.getAttribute("href").split("?")[0];
    if (href === actual && !a.getAttribute("href").includes("op=")) a.setAttribute("aria-current", "page");
    if (actual === "resultados.html") {
      const op = new URLSearchParams(location.search).get("op");
      if (op && a.getAttribute("href").includes("op=" + op)) a.setAttribute("aria-current", "page");
    }
  });
  actualizarContador();
}

/* ---------- Páginas ---------- */
function initInicio() {
  const form = $("#busqueda-rapida");
  opcionesCiudad($("#q-ciudad"));
  $$(".tabs [role=tab]").forEach((t) => {
    t.addEventListener("click", () => {
      $$(".tabs [role=tab]").forEach((x) => x.setAttribute("aria-selected", x === t ? "true" : "false"));
      form.dataset.op = t.dataset.op;
      $("#q-op").value = t.dataset.op;
      $("#btn-buscar").textContent = t.dataset.op === "venta" ? "Buscar inmuebles en venta" : "Buscar inmuebles en arriendo";
    });
  });
  const dest = $("#destacados");
  dest.innerHTML = INMUEBLES.slice().sort((a, b) => b.actualizado.localeCompare(a.actualizado)).slice(0, 3).map(tarjetaHtml).join("");
  enlazarFavoritos(dest);
}

function initResultados() {
  const p = new URLSearchParams(location.search);
  const f = $("#filtros");
  if (window.innerWidth < 960) $(".panel-filtros").removeAttribute("open");
  opcionesCiudad($("#f-ciudad"));
  const campos = ["op", "ciudad", "barrio", "tipo", "pmin", "pmax", "hab", "banos", "area", "parq", "orden"];
  const idCampo = { op: "f-op", ciudad: "f-ciudad", barrio: "f-barrio", tipo: "f-tipo", pmin: "f-pmin", pmax: "f-pmax", hab: "f-hab", banos: "f-banos", area: "f-area", parq: "f-parq", orden: "f-orden" };
  campos.forEach((c) => { if (p.get(c) !== null) $("#" + idCampo[c]).value = p.get(c); });
  if (!$("#f-op").value) $("#f-op").value = "arriendo";

  function aplicar() {
    const v = Object.fromEntries(campos.map((c) => [c, $("#" + idCampo[c]).value]));
    const rangoMal = v.pmin && v.pmax && Number(v.pmin) > Number(v.pmax);
    $("#f-pmin").setAttribute("aria-invalid", rangoMal ? "true" : "false");
    if (rangoMal) {
      $("#conteo").textContent = "El precio mínimo no puede ser mayor que el máximo. Corrige el rango para ver resultados.";
      $("#lista").innerHTML = "";
      return;
    }
    const lista = INMUEBLES.filter((i) =>
      i.operacion === v.op &&
      (!v.ciudad || i.ciudad === v.ciudad) &&
      (!v.barrio || i.barrio.toLowerCase().includes(v.barrio.trim().toLowerCase())) &&
      (!v.tipo || i.tipo === v.tipo) &&
      (!v.pmin || i.precio >= Number(v.pmin)) &&
      (!v.pmax || i.precio <= Number(v.pmax)) &&
      (!v.hab || i.hab >= Number(v.hab)) &&
      (!v.banos || i.banos >= Number(v.banos)) &&
      (!v.area || i.area >= Number(v.area)) &&
      (v.parq !== "si" || i.parq > 0)
    );
    lista.sort((a, b) =>
      v.orden === "precio-asc" ? a.precio - b.precio :
      v.orden === "precio-desc" ? b.precio - a.precio :
      b.actualizado.localeCompare(a.actualizado));
    $("#titulo-res").textContent = v.op === "venta" ? "Inmuebles en venta" : "Inmuebles en arriendo";
    $("#conteo").textContent = lista.length === 1 ? "1 inmueble encontrado" : lista.length + " inmuebles encontrados";
    const cont = $("#lista");
    cont.innerHTML = lista.length ? lista.map(tarjetaHtml).join("") :
      `<div class="vacio"><p><strong>No encontramos inmuebles con esos filtros.</strong></p><p>Prueba ampliar el rango de precio o quitar algún filtro.</p><button type="button" class="btn secundario" id="limpiar-vacio">Limpiar filtros</button></div>`;
    enlazarFavoritos(cont);
    const lv = $("#limpiar-vacio");
    if (lv) lv.addEventListener("click", limpiar);
    // chips de filtros activos
    const act = [];
    if (v.ciudad) act.push(v.ciudad);
    if (v.barrio) act.push("Barrio: " + v.barrio);
    if (v.tipo) act.push(cap(v.tipo));
    if (v.pmin) act.push("Desde " + cop(Number(v.pmin)));
    if (v.pmax) act.push("Hasta " + cop(Number(v.pmax)));
    if (v.hab) act.push(v.hab + "+ habitaciones");
    if (v.banos) act.push(v.banos + "+ baños");
    if (v.area) act.push(v.area + "+ m²");
    if (v.parq === "si") act.push("Con parqueadero");
    $("#chips").innerHTML = act.map((a) => `<li>${a}</li>`).join("");
    const resumen = $("#resumen-filtros");
    if (resumen) resumen.textContent = act.length ? `Filtros (${act.length})` : "Filtros";
    // actualizar menú activo
    $$("#nav-principal a").forEach((a) => {
      if (a.getAttribute("href").includes("op=")) {
        if (a.getAttribute("href").includes("op=" + v.op)) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      }
    });
  }
  function limpiar() {
    const op = $("#f-op").value;
    f.reset();
    $("#f-op").value = op;
    aplicar();
  }
  f.addEventListener("input", aplicar);
  f.addEventListener("change", aplicar);
  f.addEventListener("submit", (e) => { e.preventDefault(); aplicar(); });
  $("#limpiar").addEventListener("click", limpiar);
  aplicar();
}

function initInmueble() {
  const i = porId(new URLSearchParams(location.search).get("id"));
  const cont = $("#detalle");
  if (!i) {
    cont.innerHTML = `<div class="vacio"><h1>No encontramos este inmueble</h1><p>Es posible que ya no esté disponible.</p><a class="btn" href="resultados.html">Volver a los resultados</a></div>`;
    return;
  }
  document.title = i.titulo + " · Hábitat Inmobiliaria";
  $("#migas-op").textContent = i.operacion === "venta" ? "Comprar" : "Arrendar";
  $("#migas-op").href = "resultados.html?op=" + i.operacion;
  $("#migas-actual").textContent = i.titulo;
  const req = i.operacion === "arriendo"
    ? `<section class="bloque" aria-labelledby="h-req"><h2 id="h-req">Requisitos de arriendo</h2><ul class="lista">${i.req.map((r) => `<li>${r}</li>`).join("")}</ul></section>` : "";
  cont.innerHTML = `
    <div class="galeria">${imgHtml(i, "grande")}
      <div class="miniaturas" aria-hidden="true">${[1, 2, 3].map((n) => imgHtml({ ...i, id: i.id + n }, "mini")).join("")}</div>
      <p class="nota">Imágenes ilustrativas del prototipo.</p>
    </div>
    <div class="info">
      <p class="tag">${cap(i.tipo)} en ${i.operacion}</p>
      <h1>${i.titulo}</h1>
      <p class="price grande">${precioTxt(i)}</p>
      <p class="loc">${i.barrio}, ${i.ciudad}</p>
      <p class="upd">Precio y datos actualizados el ${fechaTxt(i.actualizado)}</p>
      <button type="button" class="btn-fav grande" data-fav="${i.id}" data-titulo="${i.titulo}" aria-pressed="false"><span aria-hidden="true" class="heart">♥</span><span class="fav-txt">Guardar</span></button>
      <a class="btn" href="#contacto">Contactar a la inmobiliaria</a>
    </div>
    <section class="bloque" aria-labelledby="h-car"><h2 id="h-car">Características</h2>
      <dl class="datos">
        <div><dt>Habitaciones</dt><dd>${i.hab}</dd></div>
        <div><dt>Baños</dt><dd>${i.banos}</dd></div>
        <div><dt>Área</dt><dd>${i.area} m²</dd></div>
        <div><dt>Parqueadero</dt><dd>${i.parq ? i.parq : "No incluye"}</dd></div>
        <div><dt>Tipo</dt><dd>${cap(i.tipo)}</dd></div>
        <div><dt>Operación</dt><dd>${cap(i.operacion)}</dd></div>
      </dl></section>
    <section class="bloque" aria-labelledby="h-desc"><h2 id="h-desc">Descripción</h2><p>${i.desc}</p></section>
    ${req}
    <section class="bloque" aria-labelledby="h-ubi"><h2 id="h-ubi">Ubicación</h2>
      <p>${i.barrio}, ${i.ciudad}. La dirección exacta se comparte al contactar a la inmobiliaria.</p>
      <div class="mapa" role="img" aria-label="Mapa ilustrativo de ${i.barrio}, ${i.ciudad}"><span>Mapa ilustrativo</span></div></section>
    <section class="bloque contacto" id="contacto" aria-labelledby="h-con"><h2 id="h-con">Contactar a la inmobiliaria</h2>
      <form id="form-contacto" novalidate>
        <div class="campo"><label for="c-nombre">Nombre</label><input id="c-nombre" name="nombre" autocomplete="name" required></div>
        <div class="campo"><label for="c-tel">Teléfono</label><input id="c-tel" name="tel" type="tel" inputmode="tel" autocomplete="tel" required></div>
        <div class="campo"><label for="c-msg">Mensaje</label><textarea id="c-msg" name="msg" rows="3">Hola, me interesa este inmueble: ${i.titulo}.</textarea></div>
        <p class="error" id="c-error" role="alert" hidden></p>
        <button class="btn" type="submit">Enviar mensaje</button>
        <p class="ok" id="c-ok" role="status" hidden>Mensaje enviado. La inmobiliaria responderá en las próximas horas hábiles.</p>
      </form>
      <p class="tel">¿Prefieres llamar? <a href="tel:+576010000000">(601) 000 0000</a> · Lunes a sábado, 8:00 a. m. a 6:00 p. m.</p>
    </section>`;
  enlazarFavoritos(cont);
  $("#form-contacto").addEventListener("submit", (e) => {
    e.preventDefault();
    const err = $("#c-error"), ok = $("#c-ok");
    ok.hidden = true;
    if (!$("#c-nombre").value.trim() || !/^[0-9+\s()-]{7,}$/.test($("#c-tel").value.trim())) {
      err.textContent = "Escribe tu nombre y un teléfono válido para poder contactarte.";
      err.hidden = false;
      const nomMal = !$("#c-nombre").value.trim();
      $("#c-nombre").setAttribute("aria-invalid", nomMal);
      $("#c-tel").setAttribute("aria-invalid", !nomMal);
      $("#c-nombre").setAttribute("aria-describedby", "c-error");
      $("#c-tel").setAttribute("aria-describedby", "c-error");
      (nomMal ? $("#c-nombre") : $("#c-tel")).focus();
      return;
    }
    $("#c-nombre").removeAttribute("aria-invalid"); $("#c-tel").removeAttribute("aria-invalid");
    err.hidden = true;
    ok.hidden = false;
  });
  // similares
  const sim = INMUEBLES.filter((x) => x.id !== i.id && x.operacion === i.operacion && x.ciudad === i.ciudad).slice(0, 3);
  const cs = $("#similares");
  if (sim.length) { cs.hidden = false; $("#lista-sim").innerHTML = sim.map(tarjetaHtml).join(""); enlazarFavoritos($("#lista-sim")); }
}

function initFavoritos() {
  const sel = new Set();
  function pintar() {
    const ids = favoritos.leer();
    const lista = ids.map(porId).filter(Boolean);
    const cont = $("#lista-fav");
    $("#conteo-fav").textContent = lista.length === 1 ? "1 inmueble guardado" : lista.length + " inmuebles guardados";
    $("#vacio-fav").hidden = lista.length > 0;
    $("#panel-fav").hidden = lista.length === 0;
    cont.innerHTML = lista.map((i) => `
      <article class="card fav-item">
        <a class="card-link" href="inmueble.html?id=${i.id}">${imgHtml(i)}</a>
        <div class="card-body">
          <p class="tag">${cap(i.tipo)} en ${i.operacion}</p>
          <h3><a href="inmueble.html?id=${i.id}">${i.titulo}</a></h3>
          <p class="price">${precioTxt(i)}</p>
          <p class="loc">${i.barrio}, ${i.ciudad}</p>
          <label class="chk"><input type="checkbox" data-cmp="${i.id}" ${sel.has(i.id) ? "checked" : ""}> Comparar</label>
          <button type="button" class="btn secundario peq" data-quitar="${i.id}" data-titulo="${i.titulo}">Quitar de favoritos</button>
        </div>
      </article>`).join("");
    $$("[data-quitar]", cont).forEach((b) => b.addEventListener("click", () => {
      favoritos.alternar(b.dataset.quitar);
      sel.delete(Number(b.dataset.quitar));
      actualizarContador();
      anunciar("Quitaste «" + b.dataset.titulo + "» de tus favoritos.");
      pintar();
      $("#titulo-fav").focus();
    }));
    $$("[data-cmp]", cont).forEach((c) => c.addEventListener("change", () => {
      const id = Number(c.dataset.cmp);
      if (c.checked) {
        if (sel.size >= 3) { c.checked = false; anunciar("Puedes comparar hasta 3 inmuebles a la vez."); return; }
        sel.add(id);
      } else sel.delete(id);
      tabla();
      if (sel.size >= 2) anunciar("Tabla de comparación actualizada, en la parte superior de la página.");
    }));
    tabla();
  }
  function tabla() {
    const cmp = $("#comparador");
    const items = [...sel].map(porId).filter(Boolean);
    const ay = $("#ayuda-cmp");
    ay.textContent = items.length >= 2
      ? "Comparando " + items.length + " inmuebles. La tabla de comparación está en la parte superior de esta página."
      : "Marca «Comparar» en dos o tres inmuebles para verlos lado a lado.";
    if (items.length < 2) { cmp.innerHTML = ""; return; }
    const filas = [
      ["Precio", (i) => precioTxt(i)], ["Ubicación", (i) => i.barrio + ", " + i.ciudad], ["Habitaciones", (i) => i.hab],
      ["Baños", (i) => i.banos], ["Área", (i) => i.area + " m²"], ["Parqueadero", (i) => i.parq || "No incluye"],
      ["Actualizado", (i) => fechaTxt(i.actualizado)],
    ];
    cmp.innerHTML = `<div class="tabla-wrap" tabindex="0" role="region" aria-label="Tabla de comparación"><table><caption>Comparación de inmuebles guardados</caption>
      <thead><tr><th scope="col">Característica</th>${items.map((i) => `<th scope="col"><a href="inmueble.html?id=${i.id}">${i.titulo}</a></th>`).join("")}</tr></thead>
      <tbody>${filas.map(([n, fn]) => `<tr><th scope="row">${n}</th>${items.map((i) => `<td>${fn(i)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }
  pintar();
}

function initAyuda() {
  const f = $("#form-ayuda");
  f.addEventListener("submit", (e) => {
    e.preventDefault();
    const err = $("#a-error"), ok = $("#a-ok");
    ok.hidden = true;
    if (!$("#a-nombre").value.trim() || !/\S+@\S+\.\S+/.test($("#a-correo").value) || !$("#a-msg").value.trim()) {
      err.textContent = "Completa tu nombre, un correo válido y tu consulta.";
      err.hidden = false;
      const mal = [["#a-nombre", !$("#a-nombre").value.trim()], ["#a-correo", !/\S+@\S+\.\S+/.test($("#a-correo").value)], ["#a-msg", !$("#a-msg").value.trim()]];
      mal.forEach(([sel, m]) => { $(sel).setAttribute("aria-invalid", m); $(sel).setAttribute("aria-describedby", "a-error"); });
      (mal.find(([, m]) => m) ? $(mal.find(([, m]) => m)[0]) : $("#a-nombre")).focus();
      return;
    }
    err.hidden = true;
    ["#a-nombre", "#a-correo", "#a-msg"].forEach((x) => $(x).removeAttribute("aria-invalid"));
    ok.hidden = false;
    f.reset();
  });
}

function initCuenta() {
  const tabs = $$("[role=tab]");
  function mostrar(t) {
    tabs.forEach((x) => {
      const sel = x === t;
      x.setAttribute("aria-selected", sel);
      x.tabIndex = sel ? 0 : -1;
      $("#" + x.getAttribute("aria-controls")).hidden = !sel;
    });
  }
  tabs.forEach((t, idx) => {
    t.addEventListener("click", () => mostrar(t));
    t.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const n = tabs[(idx + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
        mostrar(n); n.focus();
      }
    });
  });
  $$("form.cuenta").forEach((f) => f.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = $(".msg", f);
    msg.textContent = f.dataset.ok;
    msg.hidden = false;
  }));
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  const pagina = document.body.dataset.page;
  ({ inicio: initInicio, resultados: initResultados, inmueble: initInmueble, favoritos: initFavoritos, ayuda: initAyuda, cuenta: initCuenta }[pagina] || (() => {}))();
});
