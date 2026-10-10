'use client';

import { css, Global } from '@emotion/react';
import { Drawer, Input } from 'antd';
import { auth } from 'config/firebase';
import { useDeviceSize } from 'hooks';
import { useAdminAccounts } from 'hooks/useAdmin';
import { type AccessStateNew, isTrashOwner, PRODUCT_NAMES, type Product } from 'libs/adminAccess';
import {
    accessBadge,
    ADMIN_PANEL_PATH,
    adminPanelPath,
    type AccountRow,
    lastAccessLabel,
    PAGE_SIZE,
    programLabel,
    queryFromUrl,
    type Sort,
    type SortKey,
} from 'libs/adminPanel';
import { ChevronDown, ChevronUp, ChevronsUpDown, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { ICON, UI_FONT_CLASS, UI_FONT_VAR } from 'themes/newDesign';
import { AdminNav } from './AdminNav';
import { StudentDetail } from './NewAdminStudent';
import { TrashList } from './NewAdminTrash';
import { NewPage } from './NewPage';

const PRODUCTS: Product[] = ['imerso', 'masterclass', 'ebook'];
const STATES: { value: AccessStateNew; label: string }[] = [
    { value: 'ativo', label: 'Total' },
    { value: 'leitura', label: 'Leitura' },
    { value: 'none', label: 'Sem acesso' },
];

const styles = css`
    .ct .tools {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px 20px;
        margin-bottom: 20px;
    }
    .ct .search {
        flex: 1 1 260px;
        max-width: 340px;
    }
    .ct .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
    }
    .ct .chips button {
        min-height: 36px;
        padding: 0 12px;
        border: 1px solid var(--r-line);
        border-radius: 999px;
        background: none;
        color: var(--r-muted);
        font: inherit;
        font-size: 13px;
        cursor: pointer;
    }
    .ct .chips button[aria-pressed='true'] {
        border-color: var(--r-gold);
        background: var(--r-gold-tint);
        color: var(--r-text);
    }
    .ct .chips button:disabled {
        opacity: 0.45;
        cursor: default;
    }
    .ct .scroll {
        width: 100%;
        overflow-x: auto;
        border-top: 1px solid var(--r-line);
    }
    .ct table {
        width: 100%;
        min-width: 920px;
        border-collapse: collapse;
        font-size: 13.5px;
        font-variant-numeric: tabular-nums;
    }
    .ct th,
    .ct td {
        padding: 12px 14px;
        text-align: left;
        white-space: nowrap;
        border-bottom: 1px solid var(--r-line);
    }
    .ct th {
        padding: 0 14px;
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
        max-width: 280px;
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
    .ct .who small {
        margin-top: 2px;
        font-size: 12px;
        color: var(--r-muted);
    }
    .ct .tag {
        margin-left: 6px;
        font-size: 11.5px;
        color: var(--r-muted);
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
        border-color: var(--r-gold);
        background: var(--r-gold-tint);
        color: var(--r-text);
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
        align-items: center;
        gap: 8px;
    }
    .ui-new-page.drawer {
        padding: 4px 0 32px;
        max-width: none;
    }
`;

const SortHead: React.FC<{ label: string; field: SortKey; sort: Sort; onSort: (key: SortKey) => void }> = ({
    label,
    field,
    sort,
    onSort,
}) => (
    <th scope="col" aria-sort={sort.key === field ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
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

const Badge: React.FC<{ row: AccountRow; product: Product }> = ({ row, product }) => {
    const label = row.access ? accessBadge(row.access[product]) : null;
    return label ? <span className={`pill${label === 'Total' ? ' on' : ''}`}>{label}</span> : <>—</>;
};

/**
 * Painel de Contas (/admin/contas): todas as contas (todos os produtos) com filtros por produto, estado e busca, ordem
 * e páginas; a conta abre ao lado (?conta=uid), sem trocar de página. Lixeira: filtro só do dono.
 */
export const NewAdminContas: React.FC = () => {
    const router = useRouter();
    const params = useSearchParams();
    const isMobile = useDeviceSize() === 'mobile';
    const [initial] = useState(() => queryFromUrl(params));
    const [product, setProduct] = useState(initial.product);
    const [state, setState] = useState(initial.state);
    const [term, setTerm] = useState(initial.q ?? '');
    const [q, setQ] = useState(initial.q ?? '');
    const [sort, setSort] = useState<Sort>(initial.sort);
    const [page, setPage] = useState(1);
    const owner = isTrashOwner(auth.currentUser?.uid);
    const [trash, setTrash] = useState(initial.trash && owner);
    useEffect(() => {
        const timer = window.setTimeout(() => {
            setQ(term);
            setPage(1);
        }, 300);
        return () => window.clearTimeout(timer);
    }, [term]);
    const list = useAdminAccounts({ product, state, q, sort, page });
    const rows = list.data?.rows ?? [];
    const total = list.data?.total ?? 0;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const selected = params?.get('conta') ?? null;
    const selectedRow = rows.find((row) => row.uid === selected);
    const snapshot = !!list.data?.snapshot;

    const open = (uid: string) => router.push(adminPanelPath(uid), { scroll: false });
    const close = () => router.push(ADMIN_PANEL_PATH, { scroll: false });
    const onSort = (key: SortKey) => {
        setSort((current) => ({ key, dir: current.key === key && current.dir === 'asc' ? 'desc' : 'asc' }));
        setPage(1);
    };
    const pick =
        <T,>(set: (value: T) => void) =>
        (value: T) => {
            set(value);
            setPage(1);
        };

    return (
        <NewPage className="xwide ct">
            <Global styles={styles} />
            <AdminNav />
            <div className="tools">
                <Input
                    className="search"
                    allowClear
                    placeholder="Buscar nome ou e-mail"
                    aria-label="Buscar nome ou e-mail"
                    value={term}
                    onChange={(event) => setTerm(event.target.value)}
                    disabled={trash}
                />
                <div className="chips" role="group" aria-label="Produto">
                    {[undefined, ...PRODUCTS].map((p) => (
                        <button
                            key={p ?? 'todos'}
                            type="button"
                            aria-pressed={!trash && product === p}
                            disabled={snapshot && !!p}
                            onClick={() => {
                                setTrash(false);
                                pick(setProduct)(p);
                                if (!p) setState(undefined);
                            }}
                        >
                            {p ? PRODUCT_NAMES[p] : 'Todos'}
                        </button>
                    ))}
                </div>
                {product && !trash && (
                    <div className="chips" role="group" aria-label={`Estado no ${PRODUCT_NAMES[product]}`}>
                        {STATES.map((s) => (
                            <button
                                key={s.value}
                                type="button"
                                aria-pressed={state === s.value}
                                onClick={() => pick(setState)(state === s.value ? undefined : s.value)}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                )}
                {owner && (
                    <div className="chips" role="group" aria-label="Lixeira">
                        <button type="button" aria-pressed={trash} onClick={() => setTrash((on) => !on)}>
                            Lixeira
                        </button>
                    </div>
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
                    {snapshot && <p className="hint">Retrato da noite: só alunos do Imerso, sem os acessos.</p>}
                    <div className="scroll" role="region" aria-label="Contas" tabIndex={0}>
                        <table>
                            <thead>
                                <tr>
                                    <SortHead label="Conta" field="name" sort={sort} onSort={onSort} />
                                    {PRODUCTS.map((p) => (
                                        <th key={p} scope="col">
                                            {PRODUCT_NAMES[p]}
                                        </th>
                                    ))}
                                    {snapshot ? (
                                        <th scope="col">Último acesso</th>
                                    ) : (
                                        <SortHead
                                            label="Último acesso"
                                            field="lastAccess"
                                            sort={sort}
                                            onSort={onSort}
                                        />
                                    )}
                                    <th scope="col">Programa</th>
                                    <th scope="col" className="num">
                                        Pausas restantes
                                    </th>
                                    <th scope="col" className="num">
                                        Resets restantes
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr
                                        key={row.uid}
                                        aria-selected={row.uid === selected}
                                        onClick={() => open(row.uid)}
                                    >
                                        <td>
                                            <button
                                                type="button"
                                                className="who"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    open(row.uid);
                                                }}
                                            >
                                                <b>
                                                    {row.name || row.email || 'Sem nome'}
                                                    {row.inTrash && <span className="tag">na lixeira</span>}
                                                    {row.hasLogin === false && !row.inTrash && (
                                                        <span className="tag">sem login</span>
                                                    )}
                                                </b>
                                                {row.email && <small>{row.email}</small>}
                                            </button>
                                        </td>
                                        {PRODUCTS.map((p) => (
                                            <td key={p}>
                                                <Badge row={row} product={p} />
                                            </td>
                                        ))}
                                        <td>{lastAccessLabel(row.lastAccess)}</td>
                                        <td>{programLabel(row.program)}</td>
                                        <td className="num">{row.program?.remainingPauses ?? '—'}</td>
                                        <td className="num">{row.program?.remainingResets ?? '—'}</td>
                                    </tr>
                                ))}
                                {!rows.length && (
                                    <tr>
                                        <td colSpan={8} className="hint">
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
                                ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} de ${total}`
                                : '0'}
                        </span>
                        <div>
                            <button
                                type="button"
                                className="btn line"
                                disabled={page <= 1}
                                onClick={() => setPage((n) => n - 1)}
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
                                onClick={() => setPage((n) => n + 1)}
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
                width={isMobile ? '100%' : 600}
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

export default NewAdminContas;
