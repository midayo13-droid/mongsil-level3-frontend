"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4100";

const TOKEN_KEY = "mongsil3.token";

/** 로그인 출입증(토큰)은 이 브라우저에만 보관해요. 브라우저를 닫아도 8시간 동안은 유지돼요. */
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* 저장이 막힌 브라우저에서는 새로고침하면 다시 로그인해야 해요 */
  }
}

/** 서버가 알려 준 오류. errors 에는 칸별 안내 문구가 들어 있어요. */
export class ApiError extends Error {
  status: number;
  errors: Record<string, string>;
  constructor(message: string, status = 0, errors: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export async function api<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; skipAuthRedirect?: boolean } = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (options.body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError("서버에 연결할 수 없어요. 인터넷 연결을 확인하고 잠시 뒤 다시 해 주세요.");
  }
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const message =
      typeof data?.message === "string" ? data.message : "문제가 생겼어요. 잠시 뒤 다시 해 주세요.";
    // 로그인 시간이 끝났거나 계정이 없어졌으면 로그인 화면으로 보내요.
    if (res.status === 401 && !options.skipAuthRedirect && typeof window !== "undefined") {
      setToken(null);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login?expired=1";
      }
    }
    throw new ApiError(message, res.status, data?.errors ?? {});
  }
  return data as T;
}

/** 화면을 열 때 서버에서 목록·상세를 가져와요. */
export function useFetch<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const hasData = useRef(false);

  useEffect(() => {
    if (path === null) return;
    let ignore = false;
    // 이미 받은 내용이 있으면 화면을 비우지 않고 조용히 새로 불러와요.
    if (!hasData.current) setLoading(true);
    api<T>(path)
      .then((result) => {
        if (!ignore) {
          hasData.current = true;
          setData(result);
          setError(null);
        }
      })
      .catch((e: ApiError) => {
        if (!ignore) setError(e.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [path, tick]);

  const reload = useCallback(() => setTick((n) => n + 1), []);
  return { data, error, loading, reload };
}

/** 고른 파일을 서버로 보낼 글자(data URL)로 바꿔요. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new ApiError("파일을 읽지 못했어요. 다시 골라 주세요."));
    reader.readAsDataURL(file);
  });
}

/** 로그인이 필요한 파일을 받아 와요. (그림 태그는 로그인 정보를 보낼 수 없어서 이렇게 가져와요.) */
async function fetchBlob(path: string): Promise<Blob> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, cache: "no-store" });
  } catch {
    throw new ApiError("서버에 연결할 수 없어요. 인터넷 연결을 확인하고 잠시 뒤 다시 해 주세요.");
  }
  if (!res.ok) throw new ApiError("파일을 불러올 수 없어요. 이미 지워졌을 수 있어요.", res.status);
  return res.blob();
}

/** 파일을 내려받아요. */
export async function downloadFile(path: string, name: string) {
  const blob = await fetchBlob(path);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 그림 파일을 화면에 보여 줄 주소로 바꿔요. path 가 null 이면 아무것도 안 해요. */
export function useBlobUrl(path: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!path) return;
    let ignore = false;
    let created: string | null = null;
    fetchBlob(path)
      .then((blob) => {
        if (ignore) return;
        created = URL.createObjectURL(blob);
        setUrl(created);
      })
      .catch(() => {
        if (!ignore) setUrl(null);
      });
    return () => {
      ignore = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [path]);
  return path ? url : null;
}

/**
 * 관리자 화면 목록: 한 쪽에 size 건씩 나눠서 받아요. (기본 20건)
 * params 가 바뀌면(검색·필터) 자동으로 1쪽으로 돌아가요.
 */
export function usePaged<T>(basePath: string, params = "", size = 20) {
  const key = `${basePath}?${params}`;
  const [pg, setPg] = useState({ key, page: 1 });
  const page = pg.key === key ? pg.page : 1;
  const path = `${basePath}?${params}${params ? "&" : ""}page=${page}&size=${size}`;
  const r = useFetch<{ items: T[]; total: number; page: number; size: number }>(path);
  const total = r.data?.total ?? 0;
  return {
    data: r.data?.items ?? null,
    total,
    page: r.data?.page ?? page,
    pages: Math.max(1, Math.ceil(total / size)),
    setPage: (p: number) => setPg({ key, page: p }),
    error: r.error,
    loading: r.loading,
    reload: r.reload,
  };
}

/**
 * 고객 화면 목록: 아래로 스크롤하면 다음 쪽을 이어서 불러와요. (기본 10건씩)
 * sentinel 을 목록 맨 아래 요소의 ref 로 달아 주세요.
 */
export function useInfinite<T>(path: string, size = 10) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const pageRef = useRef(0);
  const busyRef = useRef(false);
  const doneRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (busyRef.current || doneRef.current) return;
    busyRef.current = true;
    setLoading(true);
    try {
      const next = pageRef.current + 1;
      const r = await api<{ items: T[]; total: number }>(`${path}${path.includes("?") ? "&" : "?"}page=${next}&size=${size}`);
      pageRef.current = next;
      setItems((prev) => (next === 1 ? r.items : [...prev, ...r.items]));
      setTotal(r.total);
      if (r.items.length < size || next * size >= r.total) {
        doneRef.current = true;
        setDone(true);
      }
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }, [path, size]);

  // 화면에 들어오면 첫 쪽을 불러와요. (그다음 쪽은 맨 아래로 스크롤할 때 불러와요)
  useEffect(() => {
    void loadMore();
  }, [loadMore]);

  const observer = useRef<IntersectionObserver | null>(null);
  const sentinel = useCallback(
    (node: HTMLElement | null) => {
      observer.current?.disconnect();
      if (!node) return;
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) loadMore();
      }, { rootMargin: "200px" });
      observer.current.observe(node);
    },
    [loadMore],
  );

  return { items, total, loading, error, done, sentinel, loadMore };
}
