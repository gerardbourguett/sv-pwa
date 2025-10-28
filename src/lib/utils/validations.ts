/**
 * Utilidades de validación para lecturas de medidores
 */

import type { ConsumoCalculado, AnomaliaConsumo } from '../../types';

/**
 * Valida que la lectura no exceda el número de dígitos del medidor
 */
export function validarDigitos(value: string, digitos: number): boolean {
	if (!value || isNaN(Number(value))) return false;

	const valorNumerico = parseInt(value);
	const maxValue = Math.pow(10, digitos) - 1;

	return valorNumerico <= maxValue;
}

/**
 * Calcula el consumo basado en la lectura actual y anterior
 */
export function calcularConsumo(
	valorActualStr: string,
	valorAnterior: number,
	digitos: number,
	constante: number
): ConsumoCalculado {
	if (!valorActualStr || isNaN(Number(valorActualStr))) {
		return { consumo: '', tipo: null, vlecturadigitos: 0 };
	}

	const valorActual = parseInt(valorActualStr);
	let vlecturadigitos = valorActual;
	let tipo: 'menor' | 'igual' | 'mayor' | null = null;

	if (valorActual < valorAnterior) {
		tipo = 'menor';
		// Rollover según dígitos del medidor
		switch (digitos) {
			case 1:
				vlecturadigitos = valorActual;
				break;
			case 4:
				vlecturadigitos = valorActual + 10000;
				break;
			case 5:
				vlecturadigitos = valorActual + 100000;
				break;
			case 6:
				vlecturadigitos = valorActual + 1000000;
				break;
			case 7:
				vlecturadigitos = valorActual + 10000000;
				break;
			case 8:
				vlecturadigitos = valorActual + 100000000;
				break;
			case 10:
				vlecturadigitos = valorActual + 10000000000;
				break;
		}
	} else if (valorActual === valorAnterior) {
		tipo = 'igual';
		vlecturadigitos = valorActual;
	} else {
		tipo = 'mayor';
		vlecturadigitos = valorActual;
	}

	const consumo =
		tipo === 'menor'
			? (vlecturadigitos - valorAnterior) * constante
			: (valorActual - valorAnterior) * constante;

	return {
		consumo: consumo.toString(),
		tipo,
		vlecturadigitos
	};
}

/**
 * Detecta consumos anómalos (patrón de 9s, rollover incorrecto, excesivo)
 */
export function detectarConsumoAnomalo(
	consumoCalculado: string,
	consumoAnterior: number,
	digitos: number,
	constante: number
): AnomaliaConsumo {
	if (!consumoCalculado || isNaN(Number(consumoCalculado))) {
		return { esAnomalo: false, tipo: '', mensaje: '' };
	}

	const consumoActual = Number(consumoCalculado);

	// Caso 1: Detectar consumo con muchos 9s (probable error de decimal truncado)
	const consumoStr = consumoCalculado.toString();
	const countNines = (consumoStr.match(/9/g) || []).length;
	const esPatronDe9s = countNines >= 4 && consumoStr.length >= 5;

	// Caso 2: Consumo negativo aparente (valor muy alto por rollover incorrecto)
	const maxConsumoEsperado = Math.pow(10, digitos) * constante;
	const esRolloverIncorrecto = consumoActual > maxConsumoEsperado * 0.8;

	// Caso 3: Detectar si el consumo es excesivamente alto comparado con histórico
	const umbralBase = consumoAnterior > 0 ? consumoAnterior : 500;
	const factorMultiplicador = 3;
	const umbralMaximo = Math.max(umbralBase * factorMultiplicador, 2000);
	const esConsumoExcesivo = consumoActual > umbralMaximo;

	return {
		esAnomalo: esPatronDe9s || esRolloverIncorrecto || esConsumoExcesivo,
		tipo: esPatronDe9s
			? 'decimal_truncado'
			: esRolloverIncorrecto
				? 'rollover_incorrecto'
				: esConsumoExcesivo
					? 'excesivo'
					: '',
		mensaje: esPatronDe9s
			? '⚠️ El consumo calculado contiene muchos "9s" consecutivos. Esto puede indicar un error en los decimales de la lectura importada.'
			: esRolloverIncorrecto
				? '⚠️ El consumo calculado es anormalmente alto. Verifique que los valores de lectura anterior y actual sean correctos.'
				: esConsumoExcesivo
					? '⚠️ El consumo calculado es significativamente mayor al histórico. Verifique los valores ingresados.'
					: ''
	};
}

/**
 * Detecta si el usuario probablemente olvidó una coma decimal
 */
export function detectarOlvidoComa(value: string): boolean {
	if (!value || value.length < 3) return false;

	const numValue = parseFloat(value.replace(',', '.'));

	// Si el valor es mayor a 99 y no tiene coma, podría ser un olvido
	if (numValue > 99 && !value.includes(',') && !value.includes('.') && value.length >= 3) {
		return true;
	}

	return false;
}

/**
 * Convierte valor con coma a número
 */
export function convertirComaANumero(value: string): number {
	if (!value) return 0;
	return parseFloat(value.replace(',', '.')) || 0;
}

/**
 * Formatea fecha del backend (DD-MM-YYYY o ISO) a formato input (YYYY-MM-DD)
 */
export function formatearFechaParaInput(fecha: string): string {
	if (!fecha) return '';

	// Si ya está en formato YYYY-MM-DD, retornar tal cual
	if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
		return fecha;
	}

	// Si está en formato DD-MM-YYYY o DD/MM/YYYY, convertir
	const match = fecha.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
	if (match) {
		const [, dia, mes, anio] = match;
		return `${anio}-${mes}-${dia}`;
	}

	// Si es una fecha ISO completa (2024-12-06T10:30:00), extraer solo la fecha
	if (fecha.includes('T')) {
		return fecha.split('T')[0];
	}

	return fecha;
}

/**
 * Formatea fecha de input (YYYY-MM-DD) a formato backend (DD-MM-YYYY)
 */
export function formatearFechaParaBackend(fecha: string): string {
	if (!fecha) return '';

	// Si ya está en formato DD-MM-YYYY, retornar tal cual
	if (/^\d{2}-\d{2}-\d{4}$/.test(fecha)) {
		return fecha;
	}

	// Si está en formato YYYY-MM-DD, convertir
	const match = fecha.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (match) {
		const [, anio, mes, dia] = match;
		return `${dia}-${mes}-${anio}`;
	}

	return fecha;
}

/**
 * Obtiene el máximo valor permitido para un medidor según sus dígitos
 */
export function getMaxValuePermitido(digitos: number): number {
	return Math.pow(10, digitos) - 1;
}
