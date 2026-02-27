import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { clearSession, getStoredUser, markSessionExpired } from "../utils/storage";

const PAGE_SIZE = 20;
const SEARCH_PAGE_SIZE = 10;

const toISODateLocal = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const parseISODateLocal = (isoDate) => {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const [yyyy, mm, dd] = isoDate.split("-").map(Number);
  const parsed = new Date(yyyy, mm - 1, dd);
  if (
    parsed.getFullYear() !== yyyy ||
    parsed.getMonth() !== mm - 1 ||
    parsed.getDate() !== dd
  ) {
    return null;
  }
  return parsed;
};

const formatDate = (isoDate) => {
  if (!isoDate) return "-";
  const [yyyy, mm, dd] = isoDate.split("-");
  if (!yyyy || !mm || !dd) return isoDate;
  return `${dd}/${mm}/${yyyy}`;
};

const getPresetRange = (presetKey) => {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(end);

  if (presetKey === "day") {
    return { start: toISODateLocal(start), end: toISODateLocal(end) };
  }

  if (presetKey === "week") {
    start.setDate(start.getDate() - 7);
    return { start: toISODateLocal(start), end: toISODateLocal(end) };
  }

  const endDay = end.getDate();
  const previousMonthAnchor = new Date(end.getFullYear(), end.getMonth() - 1, 1);
  const previousMonthLastDay = new Date(
    previousMonthAnchor.getFullYear(),
    previousMonthAnchor.getMonth() + 1,
    0
  ).getDate();
  start.setFullYear(previousMonthAnchor.getFullYear(), previousMonthAnchor.getMonth(), Math.min(endDay, previousMonthLastDay));
  return { start: toISODateLocal(start), end: toISODateLocal(end) };
};

const resolveOptionalDateRange = (fromRaw, toRaw, fallbackDate) => {
  const fromValid = parseISODateLocal(fromRaw) ? fromRaw : "";
  const toValid = parseISODateLocal(toRaw) ? toRaw : "";

  let start = fromValid || toValid || fallbackDate;
  let end = toValid || start;

  if (start > end) {
    [start, end] = [end, start];
  }

  return { start, end };
};

const buildDateRangeDescending = (startISO, endISO) => {
  const start = parseISODateLocal(startISO);
  const end = parseISODateLocal(endISO);
  if (!start || !end) return [];

  const dates = [];
  const cursor = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cursor >= start) {
    dates.push(toISODateLocal(cursor));
    cursor.setDate(cursor.getDate() - 1);
  }
  return dates;
};

const getRangeLabel = (startISO, endISO) =>
  startISO === endISO
    ? formatDate(startISO)
    : `${formatDate(startISO)} - ${formatDate(endISO)}`;

function Home() {
  const user = getStoredUser();
  const navigate = useNavigate();
  const defaultRange = getPresetRange("month");
  const hoyISO = toISODateLocal(new Date());

  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  const [activeTab, setActiveTab] = useState("tab3");
  const [preset, setPreset] = useState("month");
  const [fechaInicio, setFechaInicio] = useState(defaultRange.start);
  const [fechaFin, setFechaFin] = useState(defaultRange.end);
  const [fechaDiaAsisRegDesde, setFechaDiaAsisRegDesde] = useState(hoyISO);
  const [fechaDiaAsisRegHasta, setFechaDiaAsisRegHasta] = useState("");
  const [fechaDiaInscVencDesde, setFechaDiaInscVencDesde] = useState(hoyISO);
  const [fechaDiaInscVencHasta, setFechaDiaInscVencHasta] = useState("");

  const [tab1Data, setTab1Data] = useState({
    totales: { asistencias: 0, registros: 0 },
    asistencias: [],
    registros: [],
  });
  const [tab2Data, setTab2Data] = useState({
    totales: { inscripciones: 0, vencimientos: 0 },
    inscripciones: [],
    vencimientos: [],
  });
  const [tab3Data, setTab3Data] = useState({
    usuarios_activos_total: 0,
    usuarios_inactivos_total: 0,
    asistencias_periodo: 0,
    registros_nuevos_periodo: 0,
    inscripciones_periodo: 0,
    vencimientos_periodo: 0,
    vencimientos_proximos_7_dias: [],
  });

  const [loadingTab1, setLoadingTab1] = useState(false);
  const [loadingTab2, setLoadingTab2] = useState(false);
  const [loadingTab3, setLoadingTab3] = useState(false);
  const [errorTab1, setErrorTab1] = useState("");
  const [errorTab2, setErrorTab2] = useState("");
  const [errorTab3, setErrorTab3] = useState("");

  const [usuarioIdBusqueda, setUsuarioIdBusqueda] = useState("");
  const [fechaBusquedaUsuario, setFechaBusquedaUsuario] = useState("");
  const [usuarioError, setUsuarioError] = useState("");
  const [loadingUsuario, setLoadingUsuario] = useState(false);
  const [showBusquedaModal, setShowBusquedaModal] = useState(false);
  const [asistenciaUsuarioResult, setAsistenciaUsuarioResult] = useState({
    searched: false,
    usuario: null,
    asistencias: [],
  });

  const [usuarioIdBusquedaIns, setUsuarioIdBusquedaIns] = useState("");
  const [fechaBusquedaUsuarioIns, setFechaBusquedaUsuarioIns] = useState("");
  const [usuarioInsError, setUsuarioInsError] = useState("");
  const [loadingUsuarioIns, setLoadingUsuarioIns] = useState(false);
  const [showBusquedaModalIns, setShowBusquedaModalIns] = useState(false);
  const [inscripcionesUsuarioResult, setInscripcionesUsuarioResult] = useState({
    searched: false,
    usuario: null,
    inscripciones: [],
  });

  const [pageAsistenciasDia, setPageAsistenciasDia] = useState(1);
  const [pageRegistrosDia, setPageRegistrosDia] = useState(1);
  const [pageInscripcionesDia, setPageInscripcionesDia] = useState(1);
  const [pageVencimientosDia, setPageVencimientosDia] = useState(1);
  const [pageAsistenciasUsuario, setPageAsistenciasUsuario] = useState(1);
  const [pageInscripcionesUsuario, setPageInscripcionesUsuario] = useState(1);
  const [pageVencimientosProximos, setPageVencimientosProximos] = useState(1);

  const tab1ReqRef = useRef(0);
  const tab2ReqRef = useRef(0);
  const tab3ReqRef = useRef(0);
  const searchAsistenciaReqRef = useRef(0);
  const searchInscripcionesReqRef = useRef(0);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const rangoValido = useMemo(() => {
    const inicio = parseISODateLocal(fechaInicio);
    const fin = parseISODateLocal(fechaFin);
    if (!inicio || !fin) return false;
    return inicio <= fin;
  }, [fechaInicio, fechaFin]);

  const tab1Range = useMemo(
    () => resolveOptionalDateRange(fechaDiaAsisRegDesde, fechaDiaAsisRegHasta, hoyISO),
    [fechaDiaAsisRegDesde, fechaDiaAsisRegHasta, hoyISO]
  );

  const tab2Range = useMemo(
    () => resolveOptionalDateRange(fechaDiaInscVencDesde, fechaDiaInscVencHasta, hoyISO),
    [fechaDiaInscVencDesde, fechaDiaInscVencHasta, hoyISO]
  );

  const fetchResumen = async ({ dia, usuarioId = null }) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return null;
    }

    const params = new URLSearchParams({
      inicio: fechaInicio,
      fin: fechaFin,
      dia,
    });

    if (usuarioId !== null) {
      params.set("usuario_id", String(usuarioId));
    }

    const res = await fetch(`${API_BASE_URL}/dashboard/resumen?${params.toString()}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401 || res.status === 403) {
      markSessionExpired();
      clearSession();
      navigate("/", { replace: true });
      return null;
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "No se pudo cargar informacion");
    return data;
  };

  const loadTab1 = async () => {
    const reqId = ++tab1ReqRef.current;

    if (!rangoValido) {
      setErrorTab1("La fecha inicio no puede ser mayor que fecha fin.");
      setLoadingTab1(false);
      return;
    }
    if (
      fechaDiaAsisRegDesde &&
      fechaDiaAsisRegHasta &&
      fechaDiaAsisRegHasta < fechaDiaAsisRegDesde
    ) {
      setErrorTab1("La fecha Hasta no puede ser menor que la fecha Desde.");
      setLoadingTab1(false);
      return;
    }

    try {
      setLoadingTab1(true);
      setErrorTab1("");

      const { start, end } = resolveOptionalDateRange(
        fechaDiaAsisRegDesde,
        fechaDiaAsisRegHasta,
        hoyISO
      );
      const dias = buildDateRangeDescending(start, end);
      const resultados = await Promise.all(
        dias.map((dia) => fetchResumen({ dia }))
      );
      if (reqId !== tab1ReqRef.current) return;

      const asistencias = [];
      const registros = [];
      let totalAsistencias = 0;
      let totalRegistros = 0;

      for (const data of resultados) {
        if (!data) return;

        const asistenciasDia = data?.detalle?.asistencias_dia || [];
        const registrosDia = data?.detalle?.registros_dia || [];

        asistencias.push(...asistenciasDia);
        registros.push(...registrosDia);

        totalAsistencias += Number(
          data?.totales_dia?.asistencias ?? asistenciasDia.length ?? 0
        );
        totalRegistros += Number(
          data?.totales_dia?.registros ?? registrosDia.length ?? 0
        );
      }

      setTab1Data({
        totales: {
          asistencias: totalAsistencias,
          registros: totalRegistros,
        },
        asistencias,
        registros,
      });
    } catch (err) {
      if (reqId !== tab1ReqRef.current) return;
      setErrorTab1(err.message || "Error cargando datos de asistencias/registros");
    } finally {
      if (reqId === tab1ReqRef.current) {
        setLoadingTab1(false);
      }
    }
  };

  const loadTab2 = async () => {
    const reqId = ++tab2ReqRef.current;

    if (!rangoValido) {
      setErrorTab2("La fecha inicio no puede ser mayor que fecha fin.");
      setLoadingTab2(false);
      return;
    }
    if (
      fechaDiaInscVencDesde &&
      fechaDiaInscVencHasta &&
      fechaDiaInscVencHasta < fechaDiaInscVencDesde
    ) {
      setErrorTab2("La fecha Hasta no puede ser menor que la fecha Desde.");
      setLoadingTab2(false);
      return;
    }

    try {
      setLoadingTab2(true);
      setErrorTab2("");

      const { start, end } = resolveOptionalDateRange(
        fechaDiaInscVencDesde,
        fechaDiaInscVencHasta,
        hoyISO
      );
      const dias = buildDateRangeDescending(start, end);
      const resultados = await Promise.all(
        dias.map((dia) => fetchResumen({ dia }))
      );
      if (reqId !== tab2ReqRef.current) return;

      const inscripciones = [];
      const vencimientos = [];
      let totalInscripciones = 0;
      let totalVencimientos = 0;

      for (const data of resultados) {
        if (!data) return;

        const inscripcionesDia = data?.detalle?.inscripciones_dia || [];
        const vencimientosDia = data?.detalle?.vencimientos_dia || [];

        inscripciones.push(...inscripcionesDia);
        vencimientos.push(...vencimientosDia);

        totalInscripciones += Number(
          data?.totales_dia?.inscripciones ?? inscripcionesDia.length ?? 0
        );
        totalVencimientos += Number(
          data?.totales_dia?.vencimientos ?? vencimientosDia.length ?? 0
        );
      }

      setTab2Data({
        totales: {
          inscripciones: totalInscripciones,
          vencimientos: totalVencimientos,
        },
        inscripciones,
        vencimientos,
      });
    } catch (err) {
      if (reqId !== tab2ReqRef.current) return;
      setErrorTab2(err.message || "Error cargando inscripciones/vencimientos");
    } finally {
      if (reqId === tab2ReqRef.current) {
        setLoadingTab2(false);
      }
    }
  };

  const loadTab3 = async () => {
    const reqId = ++tab3ReqRef.current;

    if (!rangoValido) {
      setErrorTab3("La fecha inicio no puede ser mayor que fecha fin.");
      setLoadingTab3(false);
      return;
    }

    try {
      setLoadingTab3(true);
      setErrorTab3("");
      const data = await fetchResumen({ dia: hoyISO });
      if (!data || reqId !== tab3ReqRef.current) return;

      setTab3Data({
        usuarios_activos_total: Number(data?.tarjetas?.usuarios_activos_total || 0),
        usuarios_inactivos_total: Number(data?.tarjetas?.usuarios_inactivos_total || 0),
        asistencias_periodo: Number(data?.tarjetas?.asistencias_periodo || 0),
        registros_nuevos_periodo: Number(data?.tarjetas?.registros_nuevos_periodo || 0),
        inscripciones_periodo: Number(data?.tarjetas?.inscripciones_periodo || 0),
        vencimientos_periodo: Number(data?.tarjetas?.vencimientos_periodo || 0),
        vencimientos_proximos_7_dias: data?.detalle?.vencimientos_proximos_7_dias || [],
      });
    } catch (err) {
      if (reqId !== tab3ReqRef.current) return;
      setErrorTab3(err.message || "Error cargando resumen del periodo");
    } finally {
      if (reqId === tab3ReqRef.current) {
        setLoadingTab3(false);
      }
    }
  };

  useEffect(() => {
    if (activeTab === "tab1") loadTab1();
  }, [activeTab, fechaDiaAsisRegDesde, fechaDiaAsisRegHasta, fechaInicio, fechaFin]);

  useEffect(() => {
    if (activeTab === "tab2") loadTab2();
  }, [activeTab, fechaDiaInscVencDesde, fechaDiaInscVencHasta, fechaInicio, fechaFin]);

  useEffect(() => {
    if (activeTab === "tab3") loadTab3();
  }, [activeTab, fechaInicio, fechaFin]);

  useEffect(
    () => setPageAsistenciasDia(1),
    [tab1Data.asistencias, fechaDiaAsisRegDesde, fechaDiaAsisRegHasta]
  );
  useEffect(
    () => setPageRegistrosDia(1),
    [tab1Data.registros, fechaDiaAsisRegDesde, fechaDiaAsisRegHasta]
  );
  useEffect(
    () => setPageInscripcionesDia(1),
    [tab2Data.inscripciones, fechaDiaInscVencDesde, fechaDiaInscVencHasta]
  );
  useEffect(
    () => setPageVencimientosDia(1),
    [tab2Data.vencimientos, fechaDiaInscVencDesde, fechaDiaInscVencHasta]
  );
  useEffect(() => setPageAsistenciasUsuario(1), [asistenciaUsuarioResult.asistencias]);
  useEffect(() => setPageAsistenciasUsuario(1), [fechaBusquedaUsuario]);
  useEffect(() => setPageInscripcionesUsuario(1), [inscripcionesUsuarioResult.inscripciones]);
  useEffect(() => setPageInscripcionesUsuario(1), [fechaBusquedaUsuarioIns]);
  useEffect(() => setPageVencimientosProximos(1), [tab3Data.vencimientos_proximos_7_dias]);
  useEffect(() => {
    setFechaInicio(hoyISO);
    setFechaFin(hoyISO);
    setFechaDiaAsisRegDesde(hoyISO);
    setFechaDiaAsisRegHasta("");
    setFechaDiaInscVencDesde(hoyISO);
    setFechaDiaInscVencHasta("");

    if (activeTab !== "tab1") {
      setShowBusquedaModal(false);
    }
    if (activeTab !== "tab2") {
      setShowBusquedaModalIns(false);
    }
  }, [activeTab, hoyISO]);

  const aplicarPreset = (presetKey) => {
    const range = getPresetRange(presetKey);
    setPreset(presetKey);
    setFechaInicio(range.start);
    setFechaFin(range.end);
  };

  const onBuscarAsistenciaUsuario = async () => {
    const reqId = ++searchAsistenciaReqRef.current;
    const onlyDigits = (usuarioIdBusqueda || "").trim();
    if (!/^\d+$/.test(onlyDigits)) {
      setUsuarioError("El ID debe ser numerico.");
      setAsistenciaUsuarioResult({ searched: false, usuario: null, asistencias: [] });
      setShowBusquedaModal(false);
      return;
    }

    const userId = Number(onlyDigits);
    if (!Number.isInteger(userId) || userId <= 0) {
      setUsuarioError("El ID debe ser mayor que 0.");
      setShowBusquedaModal(false);
      setAsistenciaUsuarioResult({ searched: false, usuario: null, asistencias: [] });
      return;
    }

    try {
      setLoadingUsuario(true);
      setUsuarioError("");
      const data = await fetchResumen({
        dia: fechaBusquedaUsuario || tab1Range.end || hoyISO,
        usuarioId: userId,
      });
      if (!data || reqId !== searchAsistenciaReqRef.current) return;

      setAsistenciaUsuarioResult({
        searched: true,
        usuario: data?.detalle?.asistencia_usuario?.usuario || null,
        asistencias: data?.detalle?.asistencia_usuario?.asistencias || [],
      });
      setShowBusquedaModal(true);
    } catch (err) {
      if (reqId !== searchAsistenciaReqRef.current) return;
      setUsuarioError(err.message || "Error al consultar asistencias de usuario");
      setShowBusquedaModal(false);
      setAsistenciaUsuarioResult({ searched: false, usuario: null, asistencias: [] });
    } finally {
      if (reqId === searchAsistenciaReqRef.current) {
        setLoadingUsuario(false);
      }
    }
  };

  const onListoBusqueda = () => {
    searchAsistenciaReqRef.current += 1;
    setShowBusquedaModal(false);
    setUsuarioError("");
    setUsuarioIdBusqueda("");
    setFechaBusquedaUsuario("");
    setAsistenciaUsuarioResult({
      searched: false,
      usuario: null,
      asistencias: [],
    });
    setPageAsistenciasUsuario(1);
  };

  const onBuscarInscripcionesUsuario = async () => {
    const reqId = ++searchInscripcionesReqRef.current;
    const onlyDigits = (usuarioIdBusquedaIns || "").trim();
    if (!/^\d+$/.test(onlyDigits)) {
      setUsuarioInsError("El ID debe ser numerico.");
      setInscripcionesUsuarioResult({ searched: false, usuario: null, inscripciones: [] });
      setShowBusquedaModalIns(false);
      return;
    }

    const userId = Number(onlyDigits);
    if (!Number.isInteger(userId) || userId <= 0) {
      setUsuarioInsError("El ID debe ser mayor que 0.");
      setShowBusquedaModalIns(false);
      setInscripcionesUsuarioResult({ searched: false, usuario: null, inscripciones: [] });
      return;
    }

    try {
      setLoadingUsuarioIns(true);
      setUsuarioInsError("");
      const data = await fetchResumen({
        dia: fechaBusquedaUsuarioIns || tab2Range.end || hoyISO,
        usuarioId: userId,
      });
      if (!data || reqId !== searchInscripcionesReqRef.current) return;

      setInscripcionesUsuarioResult({
        searched: true,
        usuario: data?.detalle?.inscripciones_usuario?.usuario || null,
        inscripciones: data?.detalle?.inscripciones_usuario?.inscripciones || [],
      });
      setShowBusquedaModalIns(true);
    } catch (err) {
      if (reqId !== searchInscripcionesReqRef.current) return;
      setUsuarioInsError(err.message || "Error al consultar inscripciones de usuario");
      setShowBusquedaModalIns(false);
      setInscripcionesUsuarioResult({ searched: false, usuario: null, inscripciones: [] });
    } finally {
      if (reqId === searchInscripcionesReqRef.current) {
        setLoadingUsuarioIns(false);
      }
    }
  };

  const onListoBusquedaIns = () => {
    searchInscripcionesReqRef.current += 1;
    setShowBusquedaModalIns(false);
    setUsuarioInsError("");
    setUsuarioIdBusquedaIns("");
    setFechaBusquedaUsuarioIns("");
    setInscripcionesUsuarioResult({
      searched: false,
      usuario: null,
      inscripciones: [],
    });
    setPageInscripcionesUsuario(1);
  };

  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1024;

  const asistenciasUsuarioFiltradas = useMemo(() => {
    if (!fechaBusquedaUsuario) return asistenciaUsuarioResult.asistencias;
    return (asistenciaUsuarioResult.asistencias || []).filter(
      (item) => item.fecha === fechaBusquedaUsuario
    );
  }, [asistenciaUsuarioResult.asistencias, fechaBusquedaUsuario]);

  const inscripcionesUsuarioFiltradas = useMemo(() => {
    if (!fechaBusquedaUsuarioIns) return inscripcionesUsuarioResult.inscripciones;
    return (inscripcionesUsuarioResult.inscripciones || []).filter(
      (item) => item.fecha_inicio === fechaBusquedaUsuarioIns
    );
  }, [inscripcionesUsuarioResult.inscripciones, fechaBusquedaUsuarioIns]);

  const topbarStyle = {
    ...styles.topbar,
    ...(isMobile ? { padding: "0 12px", height: "48px" } : {}),
  };
  const topTitleStyle = {
    ...styles.topTitle,
    ...(isMobile ? { fontSize: "14px" } : {}),
  };
  const avatarStyle = {
    ...styles.avatar,
    ...(isMobile ? { width: "30px", height: "30px", fontSize: "13px" } : {}),
  };
  const contentStyle = {
    ...styles.content,
    ...(isMobile
      ? { padding: "12px", minHeight: "calc(100vh - 48px)" }
      : isTablet
      ? { padding: "16px" }
      : {}),
  };
  const tab1Label = getRangeLabel(tab1Range.start, tab1Range.end);
  const tab2Label = getRangeLabel(tab2Range.start, tab2Range.end);
  const tab1EsRango = tab1Range.start !== tab1Range.end;
  const tab2EsRango = tab2Range.start !== tab2Range.end;

  return (
    <>
      <header style={topbarStyle}>
        <span style={topTitleStyle}>Sistema de control de usuarios y control de accesos.</span>
        <div style={styles.topRight}>
          <div style={avatarStyle}>{user?.nombre ? user.nombre.charAt(0).toUpperCase() : "H"}</div>
        </div>
      </header>

      <main style={contentStyle}>
        <section style={styles.card}>
          <h2 style={styles.title}>Panel de informacion</h2>

          <div style={styles.tabs}>
            <TabBtn active={activeTab === "tab3"} onClick={() => setActiveTab("tab3")}>General</TabBtn>
            <TabBtn active={activeTab === "tab1"} onClick={() => setActiveTab("tab1")}>Asistencia y Registros</TabBtn>
            <TabBtn active={activeTab === "tab2"} onClick={() => setActiveTab("tab2")}>Inscripciones y Vencimientos</TabBtn>
          </div>

          {activeTab === "tab1" && (
            <>
              <div style={styles.filterBox}>
                <div style={styles.filterFrame}>
                  <span style={styles.frameTitle}>Filtro para listas</span>
                  <Field label="Desde">
                    <input
                      type="date"
                      value={fechaDiaAsisRegDesde}
                      onChange={(e) => setFechaDiaAsisRegDesde(e.target.value)}
                      style={styles.input}
                    />
                  </Field>
                  <Field label="Hasta (opcional)">
                    <input
                      type="date"
                      value={fechaDiaAsisRegHasta}
                      onChange={(e) => setFechaDiaAsisRegHasta(e.target.value)}
                      min={fechaDiaAsisRegDesde || undefined}
                      style={styles.input}
                    />
                  </Field>
                </div>

                <div style={styles.searchFrame}>
                  <span style={styles.frameTitle}>Busqueda por ID</span>
                  <span style={styles.label}>Buscar asistencias por ID</span>
                  <div style={styles.searchInlineRow}>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={usuarioIdBusqueda}
                      onChange={(e) => setUsuarioIdBusqueda(e.target.value.replace(/\D/g, ""))}
                      placeholder="ID de usuario"
                      style={styles.searchInput}
                    />

                    <input
                      type="date"
                      value={fechaBusquedaUsuario}
                      onChange={(e) => setFechaBusquedaUsuario(e.target.value)}
                      style={styles.searchInput}
                      title="Filtro por dia (opcional)"
                    />

                    <button type="button" style={styles.searchBtn} onClick={onBuscarAsistenciaUsuario}>
                      Buscar
                    </button>
                  </div>
                </div>
              </div>

              {loadingTab1 && <p style={styles.info}>Cargando datos...</p>}
              {!loadingTab1 && errorTab1 && <p style={styles.error}>{errorTab1}</p>}

              {!loadingTab1 && !errorTab1 && (
                <>
                  <div style={styles.grid2}>
                    <StatCard title={`Asistencias (${tab1Label})`} value={tab1Data.totales.asistencias} />
                    <StatCard title={`Registros (${tab1Label})`} value={tab1Data.totales.registros} />
                  </div>

                  <div style={styles.grid2}>
                    <Panel title={`Lista de asistencias (${tab1Label})`}>
                      <PagedTable
                        headers={["ID", "Nombre", "Hora"]}
                        rows={tab1Data.asistencias.map((x) => [x.usuario_id, `${x.nombre || ""} ${x.apellido || ""}`.trim(), x.hora_am_pm || "-"])}
                        page={pageAsistenciasDia}
                        setPage={setPageAsistenciasDia}
                        emptyLabel={
                          tab1EsRango
                            ? "No hubo asistencias en el rango seleccionado."
                            : "No hubo asistencias este dia."
                        }
                      />
                    </Panel>
                    <Panel title={`Lista de registros (${tab1Label})`}>
                      <PagedTable
                        headers={["ID", "Nombre", "Hora de registro"]}
                        rows={tab1Data.registros.map((x) => [x.usuario_id, `${x.nombre || ""} ${x.apellido || ""}`.trim(), x.hora_registro_am_pm || "-"])}
                        page={pageRegistrosDia}
                        setPage={setPageRegistrosDia}
                        emptyLabel={
                          tab1EsRango
                            ? "No hubo registros en el rango seleccionado."
                            : "No hubo registros este dia."
                        }
                      />
                    </Panel>
                  </div>
                </>
              )}

              {usuarioError && <p style={styles.error}>{usuarioError}</p>}
              {loadingUsuario && <p style={styles.info}>Consultando usuario...</p>}

              {showBusquedaModal && !loadingUsuario && (
                <div style={styles.modalOverlay}>
                  <div style={styles.modalCard}>
                    <h3 style={styles.modalTitle}>Resultado de busqueda por ID</h3>

                    {asistenciaUsuarioResult.usuario ? (
                      <div style={styles.userSummaryCard}>
                        <h4 style={styles.userSummaryTitle}>Datos del usuario</h4>
                        <div style={styles.userSummaryGrid}>
                          <div style={styles.userSummaryItem}>
                            <span style={styles.userSummaryLabel}>ID</span>
                            <span style={styles.userSummaryValue}>{asistenciaUsuarioResult.usuario.id}</span>
                          </div>
                          <div style={styles.userSummaryItem}>
                            <span style={styles.userSummaryLabel}>Nombre</span>
                            <span style={styles.userSummaryValue}>{asistenciaUsuarioResult.usuario.nombre}</span>
                          </div>
                          <div style={styles.userSummaryItem}>
                            <span style={styles.userSummaryLabel}>Apellido</span>
                            <span style={styles.userSummaryValue}>{asistenciaUsuarioResult.usuario.apellido}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p style={styles.info}>Usuario no encontrado.</p>
                    )}

                    {asistenciaUsuarioResult.usuario && (
                      <PagedTable
                        headers={["Fecha", "Hora"]}
                        rows={asistenciasUsuarioFiltradas.map((x) => [formatDate(x.fecha), x.hora_am_pm || "-"])}
                        page={pageAsistenciasUsuario}
                        setPage={setPageAsistenciasUsuario}
                        pageSize={SEARCH_PAGE_SIZE}
                        emptyLabel={
                          fechaBusquedaUsuario
                            ? "Este usuario no tiene asistencias en ese dia."
                            : "Este usuario no tiene asistencias registradas."
                        }
                      />
                    )}

                    <div style={styles.modalActions}>
                      <button type="button" style={styles.doneBtn} onClick={onListoBusqueda}>
                        Listo
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "tab2" && (
            <>
              <div style={styles.filterBox}>
                <div style={styles.filterFrame}>
                  <span style={styles.frameTitle}>Filtro para listas</span>
                  <Field label="Desde">
                    <input
                      type="date"
                      value={fechaDiaInscVencDesde}
                      onChange={(e) => setFechaDiaInscVencDesde(e.target.value)}
                      style={styles.input}
                    />
                  </Field>
                  <Field label="Hasta (opcional)">
                    <input
                      type="date"
                      value={fechaDiaInscVencHasta}
                      onChange={(e) => setFechaDiaInscVencHasta(e.target.value)}
                      min={fechaDiaInscVencDesde || undefined}
                      style={styles.input}
                    />
                  </Field>
                </div>

                <div style={styles.searchFrame}>
                  <span style={styles.frameTitle}>Busqueda por ID</span>
                  <span style={styles.label}>Buscar inscripciones por ID</span>
                  <div style={styles.searchInlineRow}>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={usuarioIdBusquedaIns}
                      onChange={(e) => setUsuarioIdBusquedaIns(e.target.value.replace(/\D/g, ""))}
                      placeholder="ID de usuario"
                      style={styles.searchInput}
                    />

                    <input
                      type="date"
                      value={fechaBusquedaUsuarioIns}
                      onChange={(e) => setFechaBusquedaUsuarioIns(e.target.value)}
                      style={styles.searchInput}
                      title="Filtro por fecha de inicio (opcional)"
                    />

                    <button type="button" style={styles.searchBtn} onClick={onBuscarInscripcionesUsuario}>
                      Buscar
                    </button>
                  </div>
                </div>
              </div>

              {loadingTab2 && <p style={styles.info}>Cargando datos...</p>}
              {!loadingTab2 && errorTab2 && <p style={styles.error}>{errorTab2}</p>}

              {!loadingTab2 && !errorTab2 && (
                <>
                  <div style={styles.grid2}>
                    <StatCard title={`Inscripciones (${tab2Label})`} value={tab2Data.totales.inscripciones} />
                    <StatCard title={`Vencimientos (${tab2Label})`} value={tab2Data.totales.vencimientos} />
                  </div>

                  <div style={styles.grid2}>
                    <Panel title={`Lista de inscripciones (${tab2Label})`}>
                      <PagedTable
                        headers={["ID", "Nombre", "Membresia", "Inicio", "Fin"]}
                        rows={tab2Data.inscripciones.map((x) => [
                          x.usuario_id,
                          `${x.nombre || ""} ${x.apellido || ""}`.trim(),
                          x.membresia_nombre || "-",
                          formatDate(x.fecha_inicio),
                          formatDate(x.fecha_fin),
                        ])}
                        page={pageInscripcionesDia}
                        setPage={setPageInscripcionesDia}
                        emptyLabel={
                          tab2EsRango
                            ? "No hubo inscripciones en el rango seleccionado."
                            : "No hubo inscripciones este dia."
                        }
                      />
                    </Panel>
                    <Panel title={`Lista de vencimientos (${tab2Label})`}>
                      <PagedTable
                        headers={["ID", "Nombre", "Membresia", "Inicio", "Fin"]}
                        rows={tab2Data.vencimientos.map((x) => [
                          x.usuario_id,
                          `${x.nombre || ""} ${x.apellido || ""}`.trim(),
                          x.membresia_nombre || "-",
                          formatDate(x.fecha_inicio),
                          formatDate(x.fecha_fin),
                        ])}
                        page={pageVencimientosDia}
                        setPage={setPageVencimientosDia}
                        emptyLabel={
                          tab2EsRango
                            ? "No hubo vencimientos en el rango seleccionado."
                            : "No hubo vencimientos este dia."
                        }
                      />
                    </Panel>
                  </div>
                </>
              )}

              {usuarioInsError && <p style={styles.error}>{usuarioInsError}</p>}
              {loadingUsuarioIns && <p style={styles.info}>Consultando inscripciones de usuario...</p>}

              {showBusquedaModalIns && !loadingUsuarioIns && (
                <div style={styles.modalOverlay}>
                  <div style={styles.modalCard}>
                    <h3 style={styles.modalTitle}>Resultado de busqueda por ID</h3>

                    {inscripcionesUsuarioResult.usuario ? (
                      <div style={styles.userSummaryCard}>
                        <h4 style={styles.userSummaryTitle}>Datos del usuario</h4>
                        <div style={styles.userSummaryGrid}>
                          <div style={styles.userSummaryItem}>
                            <span style={styles.userSummaryLabel}>ID</span>
                            <span style={styles.userSummaryValue}>{inscripcionesUsuarioResult.usuario.id}</span>
                          </div>
                          <div style={styles.userSummaryItem}>
                            <span style={styles.userSummaryLabel}>Nombre</span>
                            <span style={styles.userSummaryValue}>{inscripcionesUsuarioResult.usuario.nombre}</span>
                          </div>
                          <div style={styles.userSummaryItem}>
                            <span style={styles.userSummaryLabel}>Apellido</span>
                            <span style={styles.userSummaryValue}>{inscripcionesUsuarioResult.usuario.apellido}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p style={styles.info}>Usuario no encontrado.</p>
                    )}

                    {inscripcionesUsuarioResult.usuario && (
                      <PagedTable
                        headers={["Membresia", "Inicio", "Fin"]}
                        rows={inscripcionesUsuarioFiltradas.map((x) => [x.membresia_nombre || "-", formatDate(x.fecha_inicio), formatDate(x.fecha_fin)])}
                        page={pageInscripcionesUsuario}
                        setPage={setPageInscripcionesUsuario}
                        pageSize={SEARCH_PAGE_SIZE}
                        emptyLabel={
                          fechaBusquedaUsuarioIns
                            ? "Este usuario no tiene inscripciones en esa fecha de inicio."
                            : "Este usuario no tiene inscripciones registradas."
                        }
                      />
                    )}

                    <div style={styles.modalActions}>
                      <button type="button" style={styles.doneBtn} onClick={onListoBusquedaIns}>
                        Listo
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "tab3" && (
            <>
              <div style={styles.grid2}>
                <StatCard
                  title="Cantidad de usuarios Activos"
                  value={tab3Data.usuarios_activos_total}
                  valueColor="#16a34a"
                />
                <StatCard
                  title="Cantidad de usuarios Inactivos"
                  value={tab3Data.usuarios_inactivos_total}
                  valueColor="#b91c1c"
                />
              </div>

              <div style={styles.periodSection}>
                <h3 style={styles.periodSectionTitle}>Resumen por periodo</h3>

                <div style={styles.filterBox}>
                  <Field label="Fecha inicio">
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => {
                        const nuevaInicio = e.target.value;
                        setPreset("custom");
                        setFechaInicio(nuevaInicio);
                        setFechaFin((prev) =>
                          prev && nuevaInicio && prev < nuevaInicio ? nuevaInicio : prev
                        );
                      }}
                      max={fechaFin || undefined}
                      style={styles.input}
                    />
                  </Field>

                  <Field label="Fecha fin">
                    <input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => {
                        const nuevaFin = e.target.value;
                        setPreset("custom");
                        setFechaFin(
                          fechaInicio && nuevaFin && nuevaFin < fechaInicio
                            ? fechaInicio
                            : nuevaFin
                        );
                      }}
                      min={fechaInicio || undefined}
                      style={styles.input}
                    />
                  </Field>

                  <div style={styles.quickWrap}>
                    {[
                      { id: "day", label: "Dia" },
                      { id: "week", label: "Semana" },
                      { id: "month", label: "Mes" },
                    ].map((x) => (
                      <button
                        key={x.id}
                        type="button"
                        onClick={() => aplicarPreset(x.id)}
                        style={{ ...styles.quickBtn, ...(preset === x.id ? styles.quickBtnActive : {}) }}
                      >
                        {x.label}
                      </button>
                    ))}
                  </div>
                </div>

                {loadingTab3 && <p style={styles.info}>Cargando resumen del periodo...</p>}
                {!loadingTab3 && errorTab3 && <p style={styles.error}>{errorTab3}</p>}

                {!loadingTab3 && !errorTab3 && (
                  <div style={styles.grid4}>
                    <StatCard title="Asistencias en periodo" value={tab3Data.asistencias_periodo} helper={`${formatDate(fechaInicio)} - ${formatDate(fechaFin)}`} />
                    <StatCard title="Registros en periodo" value={tab3Data.registros_nuevos_periodo} helper={`${formatDate(fechaInicio)} - ${formatDate(fechaFin)}`} />
                    <StatCard title="Inscripciones en periodo" value={tab3Data.inscripciones_periodo} helper={`${formatDate(fechaInicio)} - ${formatDate(fechaFin)}`} />
                    <StatCard title="Vencimientos en periodo" value={tab3Data.vencimientos_periodo} helper={`${formatDate(fechaInicio)} - ${formatDate(fechaFin)}`} />
                  </div>
                )}
              </div>

              <div style={styles.grid2}>
                <Panel title="Vencimientos de los proximos 7 dias">
                  <PagedTable
                    headers={["ID", "Nombre", "Membresia", "Vence", "Dias para vencer"]}
                    rows={(tab3Data.vencimientos_proximos_7_dias || []).map((x) => [
                      x.usuario_id,
                      `${x.nombre || ""} ${x.apellido || ""}`.trim(),
                      x.membresia_nombre || "-",
                      formatDate(x.fecha_fin),
                      `${Number(x.dias_restantes ?? 0)} dia(s)`,
                    ])}
                    page={pageVencimientosProximos}
                    setPage={setPageVencimientosProximos}
                    emptyLabel="No hay vencimientos en los proximos 7 dias."
                  />
                </Panel>
              </div>
            </>
          )}
        </section>
      </main>
    </>
  );
}

function Field({ label, children }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} style={{ ...styles.tabBtn, ...(active ? styles.tabBtnActive : {}) }}>
      {children}
    </button>
  );
}

function Panel({ title, children }) {
  return (
    <article style={styles.panel}>
      <h3 style={styles.panelTitle}>{title}</h3>
      {children}
    </article>
  );
}

function StatCard({ title, value, helper, valueColor }) {
  return (
    <article style={styles.statCard}>
      <p style={styles.statTitle}>{title}</p>
      <p style={{ ...styles.statValue, ...(valueColor ? { color: valueColor } : {}) }}>{value}</p>
      {helper ? <p style={styles.statHelper}>{helper}</p> : null}
    </article>
  );
}

function PagedTable({ headers, rows, page, setPage, emptyLabel, pageSize = PAGE_SIZE }) {
  if (!rows.length) return <p style={styles.info}>{emptyLabel}</p>;

  const totalPages = Math.ceil(rows.length / pageSize);
  const currentPage = Math.min(page, totalPages);
  const from = (currentPage - 1) * pageSize;
  const pageRows = rows.slice(from, from + pageSize);

  return (
    <>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header} style={styles.th}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, rowIdx) => (
              <tr key={`r-${rowIdx}`}>
                {row.map((cell, cellIdx) => (
                  <td key={`c-${rowIdx}-${cellIdx}`} style={styles.td}>{cell ?? "-"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button type="button" style={styles.pageBtn} disabled={currentPage === 1} onClick={() => setPage(Math.max(1, currentPage - 1))}>Anterior</button>
          <span style={styles.pageText}>Pagina {currentPage} de {totalPages}</span>
          <button type="button" style={styles.pageBtn} disabled={currentPage === totalPages} onClick={() => setPage(Math.min(totalPages, currentPage + 1))}>Siguiente</button>
        </div>
      )}
    </>
  );
}

const styles = {
  topbar: {
    height: "40px",
    backgroundColor: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    borderBottom: "1px solid #d1d5db",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
  },
  topTitle: { fontSize: "16px", fontWeight: "600", color: "#111827" },
  topRight: { display: "flex", alignItems: "center" },
  avatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    backgroundColor: "#a31211",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    fontSize: "14px",
  },
  content: {
    padding: "24px",
    backgroundColor: "#f9fafb",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    minHeight: "calc(100vh - 40px)",
  },
  card: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
    width: "100%",
    maxWidth: "1120px",
    border: "1px solid #e5e7eb",
    boxSizing: "border-box",
  },
  title: { margin: 0, marginBottom: "10px", fontSize: "24px", color: "#111827" },
  tabs: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "8px",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "10px",
  },
  tabBtn: {
    border: "1px solid #cbd5e1",
    backgroundColor: "#f8fafc",
    color: "#334155",
    borderRadius: "8px",
    padding: "8px 12px",
    fontWeight: "600",
    cursor: "pointer",
    width: "100%",
    textAlign: "center",
    transition: "all 0.2s ease",
  },
  tabBtnActive: { backgroundColor: "#1e293b", border: "1px solid #1e293b", color: "#f8fafc" },
  filterBox: {
    marginTop: "12px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    alignItems: "stretch",
    gap: "12px",
    padding: "12px",
    borderRadius: "10px",
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
  },
  filterFrame: {
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "10px",
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "6px",
    width: "100%",
    minHeight: "120px",
  },
  frameTitle: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#374151",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "4px",
  },
  field: { display: "flex", flexDirection: "column", gap: "6px", minWidth: "170px" },
  label: { fontSize: "13px", color: "#4b5563", fontWeight: "600" },
  input: {
    height: "38px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    padding: "0 10px",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    backgroundColor: "#fff",
  },
  searchFrame: {
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "10px",
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "8px",
    width: "100%",
    minHeight: "120px",
  },
  searchInlineRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) auto",
    gap: "8px",
    alignItems: "center",
  },
  searchInput: {
    height: "38px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    padding: "0 10px",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    backgroundColor: "#fff",
    width: "100%",
  },
  quickWrap: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginLeft: "auto" },
  quickBtn: {
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "8px 12px",
    backgroundColor: "#fff",
    color: "#111827",
    fontWeight: "600",
    cursor: "pointer",
  },
  quickBtnActive: { backgroundColor: "#a31211", color: "#fff", border: "1px solid #a31211" },
  periodSection: {
    marginTop: "12px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    backgroundColor: "#fff",
    padding: "12px",
  },
  periodSectionTitle: {
    margin: "0 0 8px 0",
    fontSize: "15px",
    color: "#111827",
    fontWeight: "700",
  },
  grid2: { marginTop: "12px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" },
  grid4: { marginTop: "12px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "12px" },
  statCard: { border: "1px solid #e5e7eb", borderRadius: "10px", padding: "14px", backgroundColor: "#fff" },
  statTitle: { margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: "600" },
  statValue: { margin: "8px 0 4px 0", fontSize: "30px", fontWeight: "800", color: "#111827" },
  statHelper: { margin: 0, fontSize: "12px", color: "#6b7280" },
  panel: { border: "1px solid #e5e7eb", borderRadius: "10px", backgroundColor: "#fff", padding: "10px" },
  panelTitle: { margin: "0 0 8px 0", fontSize: "15px", color: "#111827" },
  searchBtn: {
    border: "none",
    borderRadius: "8px",
    padding: "10px 14px",
    backgroundColor: "#1f2937",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    padding: "12px",
  },
  modalCard: {
    width: "100%",
    maxWidth: "820px",
    maxHeight: "90vh",
    overflow: "auto",
    backgroundColor: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    padding: "14px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
  },
  modalTitle: {
    margin: "0 0 8px 0",
    fontSize: "18px",
    color: "#111827",
  },
  userSummaryCard: {
    border: "1px solid #dbe3ee",
    borderRadius: "10px",
    padding: "12px",
    marginBottom: "12px",
    backgroundColor: "#f8fafc",
  },
  userSummaryTitle: {
    margin: "0 0 10px 0",
    fontSize: "15px",
    color: "#111827",
    fontWeight: "700",
  },
  userSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "10px",
  },
  userSummaryItem: {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    padding: "8px 10px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  userSummaryLabel: {
    fontSize: "11px",
    color: "#64748b",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },
  userSummaryValue: {
    fontSize: "13px",
    color: "#111827",
    fontWeight: "600",
    lineHeight: "1.25",
  },
  modalActions: {
    marginTop: "12px",
    display: "flex",
    justifyContent: "flex-end",
  },
  doneBtn: {
    border: "none",
    borderRadius: "8px",
    padding: "9px 14px",
    backgroundColor: "#1f2937",
    color: "#ffffff",
    fontWeight: "600",
    cursor: "pointer",
  },
  tableWrap: { overflowX: "auto", width: "100%" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: "520px" },
  th: { textAlign: "left", borderBottom: "none", backgroundColor: "#991b1b", color: "#ffffff", fontSize: "12px", padding: "5px 6px", whiteSpace: "nowrap", lineHeight: "1.15", fontWeight: "600" },
  td: { borderBottom: "1px solid #f1f5f9", color: "#111827", fontSize: "13px", padding: "5px 6px", whiteSpace: "nowrap", lineHeight: "1.15" },
  pagination: { marginTop: "10px", display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap" },
  pageBtn: {
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "6px 10px",
    backgroundColor: "#fff",
    color: "#111827",
    fontWeight: "600",
    cursor: "pointer",
  },
  pageText: { fontSize: "12px", color: "#374151", fontWeight: "600" },
  info: { margin: "8px 0 0 0", color: "#374151", fontSize: "13px" },
  error: { margin: "10px 0 0 0", color: "#b91c1c", fontSize: "13px", fontWeight: "600" },
};

export default Home;
