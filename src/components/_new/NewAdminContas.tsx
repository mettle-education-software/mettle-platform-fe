'use client';

import { css, Global } from '@emotion/react';
import { Drawer, Input, Select } from 'antd';
import { auth } from 'config/firebase';
import { useDeviceSize } from 'hooks';
import { fetchAllAccounts, useAdminAccounts } from 'hooks/useAdmin';
import { type AccessStateNew, isTrashOwner, PRODUCT_NAMES, type Product } from 'libs/adminAccess';
import {
    accessBadge,
    accessDetail,
    type AccountRow,
    type AccountsSummary,
    accountsCsv,
    brl,
    type ContasView,
    contasPath,
    lastAccessLabel,
    ORIGIN_FILTERS,
    type OriginFilter,
    PAGE_SIZES,
    type PageSize,
    programLabel,
    queryFromUrl,
    type Situacao,
    SITUACOES,
    type Sort,
    type SortKey,
} from 'libs/adminPanel';
import { ChevronDown, ChevronUp, ChevronsUpDown, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { ICON, UI_FONT_CLASS, UI_FONT_VAR } from 'themes/newDesign';
import { AdminNav, chipStyles } from './AdminNav';
import { StudentDetail } from './NewAdminStudent';
import { TrashList } from './NewAdminTrash';
import { NewPage } from './NewPage';

const PRODUCTS: Product[] = ['imerso', 'masterclass', 'ebook'];
const STATES: { value: AccessStateNew; label: string }[] = [
    { value: 'ativo', label: 'Ativo' },
    { value: 'leitura', label: 'Leitura' },
    { value: 'none', label: 'Sem acesso' },
];

const styles = css`
    .ct .audit {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 4px 18px;
        margin: 0 0 22px;
        padding: 14px 18px;
        border-radius: 14px;
        background: var(--r-surf);
        font-size: 13.5px;
        color: var(--r-muted);
    }
    .ct .audit .grp {
        display: inline-flex;
        align-items: baseline;
        gap: 6px;
    }
    .ct .audit button {
        padding: 0;
        border: 0;
        background: none;
        color: var(--r-text);
        font: inherit;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
        cursor: pointer;
    }
    .ct .audit button:hover,
    .ct .audit button[aria-pressed='true'] {
        color: var(--r-gold-hi);
        text-decoration: underline;
        text-underline-offset: 3px;
    }
    .ct .audit .big {
        font-size: 16px;
    }
    .ct .tools {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px 14px;
        margin-bottom: 18px;
    }
    .ct .search {
        flex: 1 1 260px;
        max-width: 360px;
    }
    .ct .tools .ant-select {
        min-width: 170px;
    }
    .ct .toggle {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 13.5px;
        color: var(--r-muted);
        cursor: pointer;
    }
    .ct .toggle input {
        accent-color: var(--r-gold);
    }
    .ct .tools .link {
        padding: 0;
        border: 0;
        background: none;
        color: var(--r-gold-hi);
        font: inherit;
        font-size: 13.5px;
        cursor: pointer;
    }
    .ct .scroll {
        width: 100%;
        overflow-x: auto;
        border-top: 1px solid var(--r-line);
    }
    .ct table {
        width: 100%;
        min-width: 980px;
        border-collapse: collapse;
        font-size: 13.5px;
        font-variant-numeric: tabular-nums;
    }
    .ct th,
    .ct td {
        padding: 12px 14px;
        text-align: left;
        vertical-align: top;
        white-space: nowrap;
        border-bottom: 1px solid var(--r-line);
    }
    .ct th {
        padding: 0 14px;
        vertical-align: middle;
        font-size: 12px;
        font-weight: 500;
        color: var(--r-muted);
    }
    .ct th button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 44px;
        padding: 0;
        border: 0;
        background: none;
        color: inherit;
        font: inherit;
        cursor: pointer;
    }
    .ct th[aria-sort='ascending'] button,
    .ct th[aria-sort='descending'] button {
        color: var(--r-gold-hi);
    }
    .ct tbody tr {
        cursor: pointer;
    }
    .ct tbody tr:hover,
    .ct tbody tr[aria-selected='true'] {
        background: var(--r-hover);
    }
    .ct .who {
        display: block;
        max-width: 300px;
        padding: 0;
        border: 0;
        background: none;
        color: var(--r-text);
        font: inherit;
        text-align: left;
        cursor: pointer;
    }
    .ct .who b,
    .ct .who small {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .ct .who b {
        font-weight: 500;
    }
    .ct .who small,
    .ct .tiny {
        display: block;
        margin-top: 3px;
        font-size: 12px;
        color: var(--r-muted);
    }
    .ct .tag {
        margin-left: 6px;
        font-size: 11.5px;
        font-weight: 400;
        color: var(--r-muted);
    }
    .ct .tag.team {
        padding: 1px 7px;
        border-radius: 999px;
        background: var(--r-gold-tint);
        color: var(--r-gold-hi);
    }
    .ct .pill {
        display: inline-block;
        padding: 2px 8px;
        border: 1px solid var(--r-line);
        border-radius: 999px;
        font-size: 12px;
        color: var(--r-muted);
    }
    .ct .pill.on {
        border-color: transparent;
        background: var(--r-gold-tint);
        color: var(--r-gold-hi);
    }
    .ct .num {
        text-align: right;
    }
    .ct .pages {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px 16px;
        margin-top: 16px;
    }
    .ct .pages div {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
    }
    .ui-new-page.drawer {
        padding: 4px 24px 32px;
        max-width: none;
    }
    @media (max-width: 860px) {
        .ui-new-page.drawer {
            padding: 4px 16px 32px;
        }
        .ct .search {
            max-width: none;
        }
        .ct .tools .ant-select {
            flex: 1 1 140px;
            min-width: 0;
        }
    }
`;

const SortHead: React.FC<{
    label: string;
    field: SortKey;
    sort: Sort;
    onSort: (key: SortKey) => void;
    className?: string;
}> = ({ label, field, sort, onSort, className }) => (
    <th
        scope="col"
        className={className}
        aria-sort={sort.key === field ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
        <button type="button" onClick={() => onSort(field)}>
            {label}
            {sort.key === field ? (
                sort.dir === 'asc' ? (
                    <ChevronUp size={14} aria-hidden />
                ) : (
                    <ChevronDown size={14} aria-hidden />
                )
            ) : (
                <ChevronsUpDown size={14} aria-hidden />
            )}
        </button>
    </th>
);

const n = (value: number | null | undefined) => (typeof value === 'number' ? value.toLocaleString('pt-BR') : '—');

/**
 * Resumo de auditoria: a base inteira (igual ao Início); cada número aplica o seu filtro na lista padrão (scope=contas:
 * quem tem produto é ativo e com login, sem lixeira e equipe), então a lista bate com o número.
 */
const Audit: React.FC<{
    summary: AccountsSummary | null;
    view: ContasView;
    owner: boolean;
    go: (patch: Partial<ContasView>, reset?: boolean) => void;
}> = ({ summary, view, owner, go }) => {
    const pressed = (patch: Partial<ContasView>) =>
        Object.entries(patch).every(([key, value]) => view[key as keyof ContasView] === value);
    const item = (label: string, value: number | null | undefined, patch: Partial<ContasView>) => (
        <button type="button" aria-pressed={pressed(patch)} onClick={() => go(patch, true)}>
            {label} {n(value)}
        </button>
    );
    return (
        <div className="audit" role="group" aria-label="Resumo das contas">
            <button
                type="button"
                className="big"
                aria-pressed={
                    !view.product && !view.situacao && !view.origin && !view.q && !view.todas && !view.lixeira
                }
                onClick={() => go({}, true)}
            >
                {n(summary?.contas)} contas
            </button>
            {PRODUCTS.map((p) => (
                <span className="grp" key={p}>
                    {PRODUCT_NAMES[p]}
                    {item('Ativo', summary?.[p].ativo, { product: p, state: 'ativo' })}/
                    {item('Leitura', summary?.[p].leitura, { product: p, state: 'leitura' })}
                </span>
            ))}
            <span className="grp">{item('Sem produto', summary?.semProduto, { situacao: 'semProduto' })}</span>
            {owner && <span className="grp">{item('Lixeira', summary?.lixeira, { lixeira: true })}</span>}
        </div>
    );
};

/** Download de um texto como arquivo (o CSV do filtro atual). */
const download = (name: string, content: string) => {
    const url = URL.createObjectURL(new Blob(['﻿', content], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * Painel de Contas v2 (/admin/contas): o resumo de auditoria, os filtros (no endereço), a lista com LTV e a conta ao
 * lado (?conta=uid). Lixeira e CSV só do dono.
 */
export const NewAdminContas: React.FC = () => {
    const router = useRouter();
    const params = useSearchParams();
    const isMobile = useDeviceSize() === 'mobile';
    const owner = isTrashOwner(auth.currentUser?.uid);
    const url = queryFromUrl(params);
    const trash = url.trash && owner;
    const selected = params?.get('conta') ?? null;
    const view: ContasView = {
        product: url.product,
        state: url.state,
        origin: url.origin,
        situacao: url.situacao,
        todas: url.todas,
        q: url.q,
        sort: url.sort,
        dir: url.dir,
        pageSize: url.pageSize,
        lixeira: trash,
    };
    /** Muda o endereço (filtros e ordem); `reset` recomeça dos filtros padrão (os números do resumo). */
    const go = (patch: Partial<ContasView>, reset = false) => {
        const base: ContasView = reset ? { sort: url.sort, dir: url.dir, pageSize: url.pageSize } : view;
        router.replace(contasPath({ ...base, ...patch, conta: selected }), { scroll: false });
    };
    // a busca vai ao endereço depois de uma pausa na digitação; mudança de fora (limpar, voltar) volta ao campo
    const [term, setTerm] = useState(url.q ?? '');
    const pushed = useRef(url.q ?? '');
    useEffect(() => {
        if ((url.q ?? '') === pushed.current) return;
        pushed.current = url.q ?? '';
        setTerm(url.q ?? '');
    }, [url.q]);
    useEffect(() => {
        const next = term.trim().slice(0, 100);
        if (next === pushed.current) return;
        const timer = window.setTimeout(() => {
            pushed.current = next;
            go({ q: next || undefined });
        }, 300);
        return () => window.clearTimeout(timer);
    }, [term]); // eslint-disable-line react-hooks/exhaustive-deps
    const q = url.q;
    const sort: Sort = { key: url.sort, dir: url.dir };
    // filtro novo (aqui, por um link ou voltando no navegador): de volta à primeira página
    const filterKey = [
        url.product,
        url.state,
        url.origin,
        url.situacao,
        url.todas,
        sort.key,
        sort.dir,
        url.pageSize,
        q,
    ].join('|');
    const [paging, setPaging] = useState({ key: filterKey, page: 1 });
    const page = paging.key === filterKey ? paging.page : 1;
    const setPage = (next: number) => setPaging({ key: filterKey, page: next });
    const query = {
        product: url.product,
        state: url.state,
        origin: url.origin,
        situacao: url.situacao,
        todas: url.todas,
        q,
        sort,
        page,
        pageSize: url.pageSize,
    };
    const list = useAdminAccounts(query, !trash);
    const rows = list.data?.rows ?? [];
    const total = list.data?.total ?? 0;
    const summary = list.data?.summary ?? null;
    const pages = Math.max(1, Math.ceil(total / url.pageSize));
    const selectedRow = rows.find((row) => row.uid === selected);
    const filtered = !!(url.product || url.origin || url.situacao || url.todas || q);
    const [exporting, setExporting] = useState<'idle' | 'busy' | 'failed'>('idle');
    const exportingRef = useRef(false);

    const open = (uid: string) => router.push(contasPath({ ...view, conta: uid }), { scroll: false });
    const close = () => router.replace(contasPath({ ...view, conta: null }), { scroll: false });
    const onSort = (key: SortKey) => go({ sort: key, dir: sort.key === key && sort.dir === 'asc' ? 'desc' : 'asc' });
    const exportCsv = async () => {
        if (exportingRef.current) return;
        exportingRef.current = true;
        setExporting('busy');
        try {
            const all = await fetchAllAccounts(query);
            download(`contas-${new Date().toISOString().slice(0, 10)}.csv`, accountsCsv(all));
            setExporting('idle');
        } catch {
            setExporting('failed');
        } finally {
            exportingRef.current = false;
        }
    };

    return (
        <NewPage className="xwide ct">
            <Global styles={[styles, chipStyles]} />
            <AdminNav />
            <Audit summary={summary} view={view} owner={owner} go={go} />
            <div className="tools">
                <Input
                    className="search"
                    allowClear
                    placeholder="Buscar nome, e-mail, telefone ou uid"
                    aria-label="Buscar nome, e-mail, telefone ou uid"
                    value={term}
                    onChange={(event) => setTerm(event.target.value)}
                    disabled={trash}
                />
                <div className="chips" role="group" aria-label="Produto">
                    {[undefined, ...PRODUCTS].map((p) => (
                        <button
                            key={p ?? 'todos'}
                            type="button"
                            aria-pressed={!trash && url.product === p}
                            onClick={() => go({ product: p, state: undefined, lixeira: false })}
                        >
                            {p ? PRODUCT_NAMES[p] : 'Todos'}
                        </button>
                    ))}
                </div>
                {url.product && !trash && (
                    <div className="chips" role="group" aria-label={`Estado no ${PRODUCT_NAMES[url.product]}`}>
                        {STATES.map((s) => (
                            <button
                                key={s.value}
                                type="button"
                                aria-pressed={url.state === s.value}
                                onClick={() => go({ state: url.state === s.value ? undefined : s.value })}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                )}
                <Select<OriginFilter>
                    allowClear
                    placeholder="Origem"
                    aria-label="Origem"
                    value={url.origin}
                    disabled={trash}
                    options={ORIGIN_FILTERS}
                    onChange={(origin) => go({ origin: origin ?? undefined })}
                />
                <Select<Situacao>
                    allowClear
                    placeholder="Situação"
                    aria-label="Situação"
                    value={url.situacao}
                    disabled={trash}
                    options={SITUACOES}
                    onChange={(situacao) => go({ situacao: situacao ?? undefined })}
                />
                <label className="toggle">
                    <input
                        type="checkbox"
                        checked={!!url.todas}
                        disabled={trash}
                        onChange={(event) => go({ todas: event.target.checked })}
                    />
                    Incluir arquivadas{summary?.arquivadas ? ` (${n(summary.arquivadas)})` : ''}
                </label>
                {owner && (
                    <div className="chips" role="group" aria-label="Lixeira">
                        <button type="button" aria-pressed={trash} onClick={() => go({ lixeira: !trash }, !trash)}>
                            Lixeira
                        </button>
                    </div>
                )}
                {(filtered || trash) && (
                    <button
                        type="button"
                        className="link"
                        onClick={() => router.replace(contasPath({ conta: selected }), { scroll: false })}
                    >
                        Limpar filtros
                    </button>
                )}
                {owner && !trash && (
                    <button type="button" className="link" onClick={exportCsv} disabled={exporting === 'busy'}>
                        {exporting === 'busy'
                            ? 'Exportando…'
                            : exporting === 'failed'
                              ? 'Exportar CSV (falhou)'
                              : 'Exportar CSV'}
                    </button>
                )}
            </div>

            {trash ? (
                <TrashList />
            ) : list.isLoading ? (
                <p className="hint" role="status">
                    Carregando…
                </p>
            ) : list.isError ? (
                <p className="hint" role="status">
                    Lista indisponível no momento.{' '}
                    <button type="button" className="btn line" onClick={() => list.refetch()}>
                        Tentar de novo
                    </button>
                </p>
            ) : (
                <>
                    <div className="scroll" role="region" aria-label="Contas" tabIndex={0}>
                        <table>
                            <thead>
                                <tr>
                                    <SortHead label="Conta" field="name" sort={sort} onSort={onSort} />
                                    {/* vencimento: o servidor ordena pelo produto filtrado (sem filtro, o Imerso) */}
                                    {PRODUCTS.map((p) =>
                                        p === (url.product ?? 'imerso') ? (
                                            <SortHead
                                                key={p}
                                                label={PRODUCT_NAMES[p]}
                                                field="expiry"
                                                sort={sort}
                                                onSort={onSort}
                                            />
                                        ) : (
                                            <th key={p} scope="col">
                                                {PRODUCT_NAMES[p]}
                                            </th>
                                        ),
                                    )}
                                    <th scope="col">Programa</th>
                                    <SortHead label="Último acesso" field="lastAccess" sort={sort} onSort={onSort} />
                                    <SortHead label="LTV" field="ltv" sort={sort} onSort={onSort} className="num" />
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <AccountLine
                                        key={row.uid}
                                        row={row}
                                        selected={row.uid === selected}
                                        onOpen={open}
                                    />
                                ))}
                                {!rows.length && (
                                    <tr>
                                        <td colSpan={7} className="hint">
                                            Nenhuma conta encontrada.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <nav className="pages" aria-label="Páginas">
                        <span className="hint" role="status">
                            {total
                                ? `${(page - 1) * url.pageSize + 1}–${Math.min(page * url.pageSize, total)} de ${n(total)}`
                                : '0'}
                        </span>
                        <div>
                            <Select<PageSize>
                                aria-label="Contas por página"
                                value={url.pageSize}
                                options={PAGE_SIZES.map((size) => ({ value: size, label: `${size} por página` }))}
                                onChange={(pageSize) => go({ pageSize })}
                            />
                            <button
                                type="button"
                                className="btn line"
                                disabled={page <= 1}
                                onClick={() => setPage(page - 1)}
                            >
                                Anterior
                            </button>
                            <span className="hint">
                                {page} / {pages}
                            </span>
                            <button
                                type="button"
                                className="btn line"
                                disabled={page >= pages}
                                onClick={() => setPage(page + 1)}
                            >
                                Próxima
                            </button>
                        </div>
                    </nav>
                </>
            )}

            <Drawer
                open={!!selected}
                onClose={close}
                placement="right"
                width={isMobile ? '100%' : 640}
                rootClassName={`ui-new-drawer ${UI_FONT_CLASS}`}
                rootStyle={UI_FONT_VAR}
                closeIcon={<X {...ICON} aria-label="Fechar" />}
                destroyOnClose
            >
                {selected && (
                    <NewPage className="drawer">
                        <StudentDetail key={selected} uid={selected} account={selectedRow} />
                    </NewPage>
                )}
            </Drawer>
        </NewPage>
    );
};

const AccountLine: React.FC<{ row: AccountRow; selected: boolean; onOpen: (uid: string) => void }> = ({
    row,
    selected,
    onOpen,
}) => (
    <tr aria-selected={selected} onClick={() => onOpen(row.uid)}>
        <td>
            <button
                type="button"
                className="who"
                onClick={(event) => {
                    event.stopPropagation();
                    onOpen(row.uid);
                }}
            >
                <b>
                    {row.name || row.email || 'Sem nome'}
                    {row.team && <span className="tag team">Equipe</span>}
                    {row.inTrash && <span className="tag">na lixeira</span>}
                    {row.hasLogin === false && !row.inTrash && <span className="tag">sem login</span>}
                </b>
                {row.email && <small>{row.email}</small>}
            </button>
        </td>
        {PRODUCTS.map((p) => {
            const label = row.access ? accessBadge(row.access[p]) : null;
            const detail = row.access ? accessDetail(row.access[p]) : null;
            return (
                <td key={p}>
                    {label ? <span className={`pill${label === 'Ativo' ? ' on' : ''}`}>{label}</span> : '—'}
                    {detail && <span className="tiny">{detail}</span>}
                </td>
            );
        })}
        <td>{programLabel(row.program)}</td>
        <td>{lastAccessLabel(row.lastAccess)}</td>
        <td className="num">
            {brl(row.ltv?.total)}
            {typeof row.ltv?.compras === 'number' && (
                <span className="tiny">
                    {row.ltv.compras} {row.ltv.compras === 1 ? 'compra' : 'compras'}
                </span>
            )}
        </td>
    </tr>
);

export default NewAdminContas;
