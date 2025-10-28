export interface Periodo {
	IdPeriodo: string;
	FechaInicio: string;
	FechaFin: string;
	FechaOrden: string;
	DescripcionPeriodo: string;
	EstadoPeriodo: number;
}

export interface PeriodoResponse {
	periodos: Periodo[];
	total: number;
}

export interface Clave {
	IdClave: string;
	DescripcionClave: string;
	IdentificadorDeAgrupacion: string;
}

export interface ClaveResponse {
	claves: Clave[];
	total: number;
}

export interface Sector {
	sectorId: string;
	descripcion: string;
	infoAdicional: string;
	estado: number;
	color: number;
}

export interface SectorResponse {
	sectores: Sector[];
	total: number;
}

export type EstadoClave =
	| 'Todos los estados'
	| 'Sin Lectura'
	| 'Lectura Normal'
	| 'Clave Informativa'
	| 'Clave relevante'
	| 'Clave Crítica';

export interface LecturaRequest {
	sector: string;
	periodo: string;
	stfechaini: string;
	stfechafin: string;
	tipoclave?: string;
	medidor?: string;
	clave?: EstadoClave;
}

export interface LecturaResponse {
	nichos: Array<{
		nombre: string;
		filas: Array<{
			numero: number;
			medidores: Array<{
				id: number;
				nSerie: string;
				claveHtml: string;
				estadoFactura: number;
				estadoClave: number;
				ultimaLectura: number;
				fechaLectura: string;
				consumo: number;
				clave: string;
			}>;
		}>;
	}>;
}

// Medidor completo del endpoint /lecturas-nicho
export interface Medidor {
	Nro: number;
	LM_Periodo: string;
	sector: string;
	nicho: string;
	ubicacion: string;
	tarifa: string;
	local: string;
	SE_ID: number;
	se_ordenlectura: number;
	ME_ID: number;
	SE_ID1: number;
	ME_NSerie: string;
	ME_Digitos: number;
	ME_ConstanteMultiplicar: number;
	LM_ID: number;
	LM_FechaLectura: string;
	LM_ValorUltimaLectura: number;
	LMC_ValorUltimaLectEnergiaReactiva: number;
	LM_ConsumoMesAnterior: string;
	LM_ConsumoAñoAnterior: string;
	LMC_EnergiaActiva: number | null;
	LMC_ConsumoEnergiaActiva: number | null;
	LMC_EnergiaReactiva: number | null;
	LMC_DemandaSuministrada: string;
	LMC_FechaDemandaSuminis: string;
	LMC_HoraDemandaSuminis: string;
	LMC_DemandaPunta: string;
	LMC_FechaDemandaPunta: string;
	LMC_HoraDemandaPunta: string;
	LMC_ConsumoEnergiaReactiva: number;
	LMC_ValorUltimaLectEnergiaActiva: string;
	LMC_ValorUltimaLectEnergiaReactiva1: string;
	LMC_ConsAñoAnteriorEnActiva: string;
	LMC_ConsAñoAnteriorEnReactiva: string;
	LMC_PorcentajeMultaMalFactorPotencia: string;
	Estado: number;
}

// Tipos de estado visual de medidores
export type EstadoMedidor =
	| 'SINLEC'
	| 'SINCLA'
	| 'CLAINF'
	| 'CLAREL'
	| 'CLACRI'
	| 'LECCER'
	| 'LECIMP';

export interface EstadoMedidorConfig {
	color: string;
	bgColor: string;
	borderColor: string;
	textColor: string;
	label: string;
	severity: number;
}

// Formulario BT-1 / BT-2
export interface FormDataBT1y2 {
	lmid: string;
	vactual: string;
	consumo: string;
	claid: string;
}

// Formulario BT-4.3
export interface FormDataBT43 {
	lmId: number;
	lecturaActiva: number;
	claveActivaId: string;
	lecturaReactiva: number;
	claveReactivaId: string;
	consumoActiva: number;
	consumoReactiva: number;
	dp: number;
	dpFecha: string;
	dpHora: string;
	ds: number;
	dsFecha: string;
	dsHora: string;
}

// Resultado de cálculo de consumo
export interface ConsumoCalculado {
	consumo: string;
	tipo: 'menor' | 'igual' | 'mayor' | null;
	vlecturadigitos: number;
}

// Anomalía detectada en consumo
export interface AnomaliaConsumo {
	esAnomalo: boolean;
	tipo: 'decimal_truncado' | 'rollover_incorrecto' | 'excesivo' | '';
	mensaje: string;
}
