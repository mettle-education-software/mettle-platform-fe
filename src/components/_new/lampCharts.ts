'use client';

import { uiFont } from 'components/_melp/_deda/DedaReader/readerFonts';
import { useTheme } from 'hooks/useTheme';
import { chartTip, softChart } from 'libs/newDesign';
import { DARK, LIGHT } from 'themes/newDesign';

const FONT = uiFont.style.fontFamily;

/** Valor e rótulo do balão de um ponto: (valor, rótulo do eixo X, nome da série) → ["33 min", "Day 2 · DEDA time"]. */
export type Tip = (value: number, x: string, series: string, index: number) => [string, string];

type Ctx = {
    series: number[][];
    seriesIndex: number;
    dataPointIndex: number;
    w: {
        globals: {
            labels?: (string | number)[];
            categoryLabels?: string[];
            seriesNames: string[];
            seriesX?: (string | number)[][];
        };
    };
};

type Options = { chart?: object; grid?: object; tooltip?: object; xaxis?: object; markers?: object };

/**
 * Gráficos da LAMP no tema em vigor (rótulos, grade, trilho do Overall) e, com `tip`, o balão da plataforma nova:
 * pequeno, nas cores do tema, valor em destaque e rótulo em palavras (sem cabeçalho cinza nem marcador). Funciona ao
 * toque (o ApexCharts trata o toque como o passar do mouse). Grade só horizontal: menos ruído.
 */
export const useSoftChart = () => {
    const light = useTheme().resolved === 'light';
    const c = light ? LIGHT : DARK;
    return <T extends Options>(options: T, tip?: Tip, bar = false): T => {
        let o = softChart(options, FONT, c['--r-muted'], light) as T & {
            plotOptions?: { radialBar?: { track?: object } };
            xaxis?: object;
            grid?: { xaxis?: object };
        };
        // anéis do Overall: o trilho escuro de cada série some no claro; um trilho neutro e leve no lugar
        const plot = o.plotOptions;
        if (light && plot?.radialBar?.track) {
            o = {
                ...o,
                plotOptions: {
                    ...plot,
                    radialBar: {
                        ...plot.radialBar,
                        track: { ...plot.radialBar.track, background: LIGHT['--r-track'] },
                    },
                },
            };
        }
        if (!tip) return o;
        return {
            ...o,
            grid: { ...o.grid, xaxis: { lines: { show: false } } },
            xaxis: { ...o.xaxis, tooltip: { enabled: false }, crosshairs: { show: !bar } },
            markers: { ...(o.markers ?? {}), size: 0, strokeWidth: 2, strokeColors: c['--r-bg'], hover: { size: 5 } },
            states: { hover: { filter: { type: 'lighten', value: 0.12 } }, active: { filter: { type: 'none' } } },
            tooltip: {
                ...(o.tooltip ?? {}),
                enabled: true,
                shared: false,
                intersect: bar,
                followCursor: false,
                marker: { show: false },
                custom: ({ series, seriesIndex, dataPointIndex, w }: Ctx) => {
                    // eixo numérico (semanas): o x vem do próprio ponto
                    const x =
                        w.globals.categoryLabels?.[dataPointIndex] ??
                        w.globals.labels?.[dataPointIndex] ??
                        w.globals.seriesX?.[seriesIndex]?.[dataPointIndex] ??
                        '';
                    const [value, label] = tip(
                        series[seriesIndex]?.[dataPointIndex] ?? 0,
                        String(x),
                        w.globals.seriesNames[seriesIndex] ?? '',
                        dataPointIndex,
                    );
                    return chartTip(value, label);
                },
            },
        };
    };
};
