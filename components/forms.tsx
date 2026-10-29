"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError, fileToDataUrl, useBlobUrl, useFetch } from "@/lib/api";
import { formatPhoneInput, onlyNumber, todayString } from "@/lib/format";
import { EVENT_IMAGE_EXTS, fileExt, formatSize, MAX_FILE_BYTES, MAX_NOTICE_FILES, NOTICE_FILE_EXTS } from "./board-extras";
import { Alert, Field } from "./ui";

/* ---------- 공통 도구 ---------- */

export type Errors = Record<string, string>;

/** 저장 버튼을 눌렀을 때: 처리 중 표시 + 서버가 알려 준 칸별 안내를 보관해요. */
export function useSubmit() {
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(job: () => Promise<void>) {
    setBusy(true);
    setErrors({});
    setMessage(null);
    try {
      await job();
      return true;
    } catch (e) {
      if (e instanceof ApiError) {
        setErrors(e.errors);
        setMessage(e.message);
      } else {
        setMessage("문제가 생겼어요. 잠시 뒤 다시 해 주세요.");
      }
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { errors, message, busy, run };
}

export function FormMessage({ message, errors }: { message: string | null; errors?: Errors }) {
  const ref = useRef<HTMLDivElement>(null);
  // 저장이 안 되면 문제가 있는 첫 번째 입력칸으로 화면을 옮기고 그 칸에 커서를 둬요.
  // (칸에 해당하지 않는 안내만 있으면 안내 상자로 옮겨요.)
  // 오류 "내용"이 바뀔 때만 실행해요. 화면이 다시 그려질 때마다(예: 다른 칸에 글자를 칠 때마다) 실행되면
  // 사용자가 입력 중인 칸에서 커서가 틀린 첫 칸으로 튀어요. 그래서 객체가 아니라 내용(글자)으로 비교해요.
  // 저장을 누를 때마다 오류가 한 번 비워졌다가 다시 채워지므로, 같은 오류로 다시 저장해도 다시 이동해요.
  const contentKey = JSON.stringify([message, errors ?? {}]);
  useEffect(() => {
    if (!message) return;
    const scope = ref.current?.closest("form") ?? document;
    const field = scope.querySelector<HTMLElement>(".field.has-error");
    const input = field?.querySelector<HTMLElement>("input:not([type=file]), select, textarea");
    if (input) {
      input.scrollIntoView({ behavior: "smooth", block: "center" });
      input.focus({ preventScroll: true });
    } else {
      (field ?? ref.current)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentKey]);
  if (!message) return null;
  return (
    <div ref={ref}>
      <Alert kind="error">{message}</Alert>
    </div>
  );
}

export function useOptions() {
  const { data } = useFetch<{
    breeds: string[];
    genders: string[];
    styles: string[];
    groomerStatuses: string[];
    times: string[];
  }>("/options");
  return data;
}

/* ---------- 보호자 칸들 ---------- */

export interface GuardianValue {
  name: string;
  phone: string;
  email: string;
  emergency_name: string;
  emergency_phone: string;
  message: string;
}

export const emptyGuardian: GuardianValue = {
  name: "",
  phone: "",
  email: "",
  emergency_name: "",
  emergency_phone: "",
  message: "",
};

export function GuardianFields({
  value,
  onChange,
  errors,
  prefix = "",
}: {
  value: GuardianValue;
  onChange: (v: GuardianValue) => void;
  errors: Errors;
  prefix?: string;
}) {
  const set = (patch: Partial<GuardianValue>) => onChange({ ...value, ...patch });
  const err = (k: string) => errors[`${prefix}${k}`];
  return (
    <div className="form-grid">
      <Field label="이름" required error={err("name")}>
        <input value={value.name} maxLength={20} onChange={(e) => set({ name: e.target.value })} placeholder="예: 김가은" />
      </Field>
      <Field label="휴대폰 번호" required error={err("phone")} hint="숫자 11자리 (자동으로 - 가 들어가요)">
        <input
          value={value.phone}
          inputMode="numeric"
          onChange={(e) => set({ phone: formatPhoneInput(e.target.value) })}
          placeholder="010-1234-5678"
        />
      </Field>
      <Field label="이메일" required error={err("email")} full>
        <input
          value={value.email}
          inputMode="email"
          maxLength={100}
          onChange={(e) => set({ email: e.target.value })}
          placeholder="예: abc@email.com"
        />
      </Field>
      <Field label="비상연락처 이름" error={err("emergency_name")}>
        <input
          value={value.emergency_name}
          maxLength={20}
          onChange={(e) => set({ emergency_name: e.target.value })}
        />
      </Field>
      <Field label="비상연락처 번호" error={err("emergency_phone")}>
        <input
          value={value.emergency_phone}
          inputMode="numeric"
          onChange={(e) => set({ emergency_phone: formatPhoneInput(e.target.value) })}
          placeholder="010-1234-5678"
        />
      </Field>
      <Field label="하고 싶은 말" error={err("message")} full>
        <textarea
          value={value.message}
          maxLength={500}
          onChange={(e) => set({ message: e.target.value })}
          placeholder="미용실에 전하고 싶은 말을 적어 주세요."
        />
      </Field>
    </div>
  );
}

/* ---------- 강아지 칸들 ---------- */

export interface DogValue {
  name: string;
  breed: string;
  gender: string;
  age: string;
  weight: string;
  birthday: string;
  note: string;
}

export const emptyDog: DogValue = {
  name: "",
  breed: "",
  gender: "",
  age: "",
  weight: "",
  birthday: "",
  note: "",
};

export function DogFields({
  value,
  onChange,
  errors,
  prefix = "",
  showNote,
}: {
  value: DogValue;
  onChange: (v: DogValue) => void;
  errors: Errors;
  prefix?: string;
  showNote?: boolean;
}) {
  const options = useOptions();
  const set = (patch: Partial<DogValue>) => onChange({ ...value, ...patch });
  const err = (k: string) => errors[`${prefix}${k}`];
  return (
    <div className="form-grid">
      <Field label="강아지 이름" required error={err("name")}>
        <input value={value.name} maxLength={20} onChange={(e) => set({ name: e.target.value })} placeholder="예: 몽실이" />
      </Field>
      <Field label="견종" required error={err("breed")}>
        <select value={value.breed} onChange={(e) => set({ breed: e.target.value })}>
          <option value="">선택해 주세요</option>
          {options?.breeds.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </Field>
      <Field label="성별" required error={err("gender")}>
        <select value={value.gender} onChange={(e) => set({ gender: e.target.value })}>
          <option value="">선택해 주세요</option>
          {options?.genders.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </Field>
      <Field label="나이(살)" required error={err("age")} hint="숫자만 적을 수 있어요 (0~30)">
        <input
          value={value.age}
          inputMode="numeric"
          maxLength={2}
          onChange={(e) => set({ age: onlyNumber(e.target.value) })}
          placeholder="예: 3"
        />
      </Field>
      <Field label="몸무게(kg)" required error={err("weight")} hint="숫자만 적을 수 있어요. 예: 4.5">
        <input
          value={value.weight}
          inputMode="decimal"
          maxLength={5}
          onChange={(e) => set({ weight: onlyNumber(e.target.value, true) })}
          placeholder="예: 4.5"
        />
      </Field>
      <Field label="생일" error={err("birthday")}>
        <input type="date" value={value.birthday} max={todayString()} onChange={(e) => set({ birthday: e.target.value })} />
      </Field>
      {showNote && (
        <Field label="특이사항 (주의사항 첫 글)" error={err("note")} full hint="나중에 강아지 상세에서 날짜별로 추가할 수 있어요.">
          <textarea
            value={value.note}
            maxLength={300}
            onChange={(e) => set({ note: e.target.value })}
            placeholder="예: 발톱 깎을 때 예민해요."
          />
        </Field>
      )}
    </div>
  );
}

/* ---------- 신규 등록 (보호자 + 강아지 여러 마리) ---------- */

export function RegisterForm({ onDone, onCancel }: { onDone: (guardianId: number) => void; onCancel?: () => void }) {
  const [guardian, setGuardian] = useState<GuardianValue>(emptyGuardian);
  const [dogs, setDogs] = useState<DogValue[]>([{ ...emptyDog }]);
  const { errors, message, busy, run } = useSubmit();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await run(async () => {
      const result = await api<{ guardian_id: number }>("/registrations", {
        method: "POST",
        body: { guardian, dogs },
      });
      onDone(result.guardian_id);
    });
  }

  return (
    <form onSubmit={submit} noValidate>
      <FormMessage message={message} errors={errors} />
      <section className="card">
        <h2>1. 고객(보호자) 정보</h2>
        <GuardianFields value={guardian} onChange={setGuardian} errors={errors} prefix="guardian." />
      </section>
      <section className="card">
        <h2>2. 강아지 정보</h2>
        {errors["dogs"] && <div className="error-text" style={{ marginBottom: 8 }}>⚠ {errors["dogs"]}</div>}
        {dogs.map((dog, index) => (
          <div className="dog-block" key={index}>
            <div className="card-head">
              <h3>강아지 {index + 1}</h3>
              {dogs.length > 1 && (
                <button type="button" className="btn small" onClick={() => setDogs(dogs.filter((_, i) => i !== index))}>
                  이 칸 빼기
                </button>
              )}
            </div>
            <DogFields
              value={dog}
              onChange={(v) => setDogs(dogs.map((d, i) => (i === index ? v : d)))}
              errors={errors}
              prefix={`dogs.${index}.`}
              showNote
            />
          </div>
        ))}
        {dogs.length < 10 && (
          <button type="button" className="btn" onClick={() => setDogs([...dogs, { ...emptyDog }])}>
            + 강아지 한 마리 더 추가
          </button>
        )}
      </section>
      <div className="form-actions">
        <button className="btn primary big" type="submit" disabled={busy}>
          {busy ? "저장 중..." : "등록하기"}
        </button>
        {onCancel && (
          <button className="btn big" type="button" onClick={onCancel}>
            취소
          </button>
        )}
      </div>
    </form>
  );
}

/* ---------- 보호자 수정 ---------- */

export function GuardianEditForm({
  guardianId,
  initial,
  onDone,
  onCancel,
}: {
  guardianId: number;
  initial: GuardianValue;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<GuardianValue>(initial);
  const { errors, message, busy, run } = useSubmit();
  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        await run(async () => {
          await api(`/guardians/${guardianId}`, { method: "PUT", body: value });
          onDone();
        });
      }}
    >
      <FormMessage message={message} errors={errors} />
      <GuardianFields value={value} onChange={setValue} errors={errors} />
      <div className="form-actions">
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? "저장 중..." : "저장하기"}
        </button>
        <button className="btn" type="button" onClick={onCancel}>
          취소
        </button>
      </div>
    </form>
  );
}

/* ---------- 강아지 수정 / 기존 고객에게 강아지 추가 ---------- */

export function DogForm({
  mode,
  id,
  initial,
  onDone,
  onCancel,
}: {
  mode: "edit" | "add";
  /** edit 이면 강아지 번호, add 이면 보호자 번호 */
  id: number;
  initial: DogValue;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<DogValue>(initial);
  const { errors, message, busy, run } = useSubmit();
  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        await run(async () => {
          if (mode === "edit") await api(`/dogs/${id}`, { method: "PUT", body: value });
          else await api(`/guardians/${id}/dogs`, { method: "POST", body: value });
          onDone();
        });
      }}
    >
      <FormMessage message={message} errors={errors} />
      <DogFields value={value} onChange={setValue} errors={errors} showNote={mode === "add"} />
      <div className="form-actions">
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? "저장 중..." : mode === "edit" ? "저장하기" : "강아지 추가"}
        </button>
        <button className="btn" type="button" onClick={onCancel}>
          취소
        </button>
      </div>
    </form>
  );
}

/* ---------- 주의사항 추가 ---------- */

export function NoteForm({ dogId, onDone }: { dogId: number; onDone: () => void }) {
  const [content, setContent] = useState("");
  const { errors, message, busy, run } = useSubmit();
  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await run(async () => {
          await api(`/dogs/${dogId}/notes`, { method: "POST", body: { content } });
        });
        if (ok) {
          setContent("");
          onDone();
        }
      }}
    >
      <Field label="주의사항 추가" error={errors.content} hint="한 번 저장하면 고칠 수 없어요. 잘못 적으면 삭제하고 다시 적어 주세요.">
        <textarea
          value={content}
          maxLength={300}
          onChange={(e) => setContent(e.target.value)}
          placeholder="예: 드라이기 소리를 무서워해요."
        />
      </Field>
      {message && !errors.content && <Alert kind="error">{message}</Alert>}
      <button className="btn primary" type="submit" disabled={busy}>
        {busy ? "저장 중..." : "주의사항 저장"}
      </button>
    </form>
  );
}

/* ---------- 미용 기록 ---------- */

export interface RecordValue {
  dog_id: string;
  groomer_id: string;
  groomed_at: string;
  style: string;
  price: string;
  memo: string;
}

export function RecordForm({
  recordId,
  initial,
  hasPhoto,
  lockDog,
  onDone,
  onCancel,
}: {
  recordId?: number;
  initial: RecordValue;
  hasPhoto?: boolean;
  /** 강아지 상세에서 들어왔을 때는 강아지를 바꾸지 못하게 해요. */
  lockDog?: boolean;
  onDone: (id: number) => void;
  onCancel: () => void;
}) {
  const options = useOptions();
  const dogs = useFetch<any[]>("/dogs");
  const groomers = useFetch<any[]>("/groomers");
  const [value, setValue] = useState<RecordValue>(initial);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const savedPhotoUrl = useBlobUrl(recordId && hasPhoto && !photo && !removePhoto ? `/records/${recordId}/photo` : null);
  const { errors, message, busy, run } = useSubmit();
  const set = (patch: Partial<RecordValue>) => setValue({ ...value, ...patch });

  // 퇴사한 관리사는 새로 고를 수 없어요. (이미 그 사람으로 저장된 기록을 고칠 때만 보여 줘요.)
  const groomerChoices = (groomers.data ?? []).filter(
    (g) => g.status === "근무중" || String(g.id) === initial.groomer_id,
  );

  function onPhoto(file: File | undefined) {
    setPhotoError(null);
    if (!file) {
      setPhoto(null);
      return;
    }
    if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setPhotoError("사진은 5MB 이하의 jpg, png 파일만 올릴 수 있어요.");
      setPhoto(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        await run(async () => {
          const body: Record<string, unknown> = { ...value };
          if (photo) body.photo_data = photo;
          if (removePhoto) body.remove_photo = true;
          const result = await api<{ id: number }>(recordId ? `/records/${recordId}` : "/records", {
            method: recordId ? "PUT" : "POST",
            body,
          });
          onDone(result.id);
        });
      }}
    >
      <FormMessage message={message} errors={errors} />
      <div className="form-grid">
        <Field label="강아지" required error={errors.dog_id}>
          <select value={value.dog_id} disabled={lockDog} onChange={(e) => set({ dog_id: e.target.value })}>
            <option value="">선택해 주세요</option>
            {(dogs.data ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.guardian_name})
              </option>
            ))}
          </select>
        </Field>
        <Field label="담당 관리사" required error={errors.groomer_id} hint="근무 중인 관리사만 고를 수 있어요">
          <select value={value.groomer_id} onChange={(e) => set({ groomer_id: e.target.value })}>
            <option value="">선택해 주세요</option>
            {groomerChoices.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
                {g.status !== "근무중" ? " (퇴사)" : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="미용 날짜" required error={errors.groomed_at}>
          <input type="date" value={value.groomed_at} onChange={(e) => set({ groomed_at: e.target.value })} />
        </Field>
        <Field label="스타일" required error={errors.style}>
          <select value={value.style} onChange={(e) => set({ style: e.target.value })}>
            <option value="">선택해 주세요</option>
            {options?.styles.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="가격(원)" required error={errors.price} hint="숫자만 적을 수 있어요">
          <input
            value={value.price}
            inputMode="numeric"
            maxLength={8}
            onChange={(e) => set({ price: onlyNumber(e.target.value) })}
            placeholder="예: 45000"
          />
        </Field>
        <Field label="사진" error={errors.photo_data || photoError || undefined} hint="jpg, png 파일 / 5MB 이하">
          <input type="file" accept="image/jpeg,image/png" onChange={(e) => onPhoto(e.target.files?.[0])} />
          {photo && <img className="preview" src={photo} alt="올릴 사진 미리보기" />}
          {recordId && hasPhoto && !photo && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {!removePhoto && savedPhotoUrl && <img className="preview" src={savedPhotoUrl} alt="등록된 사진" />}
              <label style={{ fontWeight: 400, marginTop: 6 }}>
                <input
                  type="checkbox"
                  style={{ width: "auto", minHeight: 0, marginRight: 6 }}
                  checked={removePhoto}
                  onChange={(e) => setRemovePhoto(e.target.checked)}
                />
                등록된 사진 지우기
              </label>
              {removePhoto && <div className="hint">저장하면 사진이 지워져요. 마음이 바뀌면 체크를 풀어 주세요.</div>}
            </>
          )}
        </Field>
        <Field label="메모" error={errors.memo} full>
          <textarea value={value.memo} maxLength={500} onChange={(e) => set({ memo: e.target.value })} />
        </Field>
      </div>
      <div className="form-actions">
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? "저장 중..." : "저장하기"}
        </button>
        <button className="btn" type="button" onClick={onCancel}>
          취소
        </button>
      </div>
    </form>
  );
}

/* ---------- 관리사 / 공지사항 / 이벤트 (관리 화면) ---------- */

export function GroomerForm({
  id,
  initial,
  onDone,
  onCancel,
}: {
  id?: number;
  initial: { name: string; phone: string; status: string };
  onDone: () => void;
  onCancel: () => void;
}) {
  const options = useOptions();
  const [value, setValue] = useState(initial);
  const { errors, message, busy, run } = useSubmit();
  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        await run(async () => {
          await api(id ? `/groomers/${id}` : "/groomers", { method: id ? "PUT" : "POST", body: value });
          onDone();
        });
      }}
    >
      <FormMessage message={message} errors={errors} />
      <div className="form-grid">
        <Field label="이름" required error={errors.name}>
          <input value={value.name} maxLength={20} onChange={(e) => setValue({ ...value, name: e.target.value })} />
        </Field>
        <Field label="휴대폰 번호" required error={errors.phone} hint="숫자 11자리">
          <input
            value={value.phone}
            inputMode="numeric"
            onChange={(e) => setValue({ ...value, phone: formatPhoneInput(e.target.value) })}
            placeholder="010-1234-5678"
          />
        </Field>
        <Field label="근무 상태" required error={errors.status}>
          <select value={value.status} onChange={(e) => setValue({ ...value, status: e.target.value })}>
            {options?.groomerStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="form-actions">
        <button className="btn admin" type="submit" disabled={busy}>
          {busy ? "저장 중..." : "저장하기"}
        </button>
        <button className="btn" type="button" onClick={onCancel}>
          취소
        </button>
      </div>
    </form>
  );
}

/** 고른 파일들이 규칙에 맞는지 미리 확인해요. 문제가 있으면 안내 글을, 없으면 null 을 돌려줘요. */
function checkFiles(picked: File[], exts: string[], label: string) {
  for (const f of picked) {
    if (!exts.includes(fileExt(f.name))) return `${label}은 ${exts.join(", ")} 파일만 올릴 수 있어요.`;
    if (f.size > MAX_FILE_BYTES) return `${label}은 5MB 이하 파일만 올릴 수 있어요. (${f.name})`;
  }
  return null;
}

export function NoticeForm({
  id,
  initial,
  onDone,
  onCancel,
}: {
  id?: number;
  initial: { title: string; content: string };
  onDone: () => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [removed, setRemoved] = useState<number[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const existing = useFetch<{ files: { id: number; name: string; size: number }[] }>(id ? `/notices/${id}` : null);
  const keptFiles = (existing.data?.files ?? []).filter((f) => !removed.includes(f.id));
  const { errors, message, busy, run } = useSubmit();

  function pick(list: FileList | null) {
    const picked = Array.from(list ?? []);
    if (picked.length === 0) return;
    const problem =
      checkFiles(picked, NOTICE_FILE_EXTS, "첨부파일") ??
      (keptFiles.length + newFiles.length + picked.length > MAX_NOTICE_FILES
        ? `첨부파일은 공지 하나에 ${MAX_NOTICE_FILES}개까지 올릴 수 있어요.`
        : null);
    setFileError(problem);
    if (!problem) setNewFiles([...newFiles, ...picked]);
  }

  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        await run(async () => {
          const saved = await api<{ id: number }>(id ? `/notices/${id}` : "/notices", { method: id ? "PUT" : "POST", body: value });
          const noticeId = id ?? saved.id;
          try {
            for (const fileId of removed) await api(`/notices/${noticeId}/files/${fileId}`, { method: "DELETE" });
            for (const file of newFiles) {
              await api(`/notices/${noticeId}/files`, { method: "POST", body: { name: file.name, data: await fileToDataUrl(file) } });
            }
          } catch (err: any) {
            // 공지는 저장됐지만 파일에서 문제가 생긴 경우예요. 다시 저장하면 이어서 올릴 수 있어요.
            throw new ApiError(`공지는 저장됐지만 첨부파일에 문제가 있어요. ${err.message}`, err.status ?? 0, {});
          }
          onDone();
        });
      }}
    >
      <FormMessage message={message} errors={errors} />
      <Field label="제목" required error={errors.title}>
        <input value={value.title} maxLength={50} onChange={(e) => setValue({ ...value, title: e.target.value })} />
      </Field>
      <Field label="내용" required error={errors.content}>
        <textarea value={value.content} maxLength={1000} onChange={(e) => setValue({ ...value, content: e.target.value })} />
      </Field>
      <Field
        label="첨부파일"
        error={fileError ?? undefined}
        hint={`${MAX_NOTICE_FILES}개까지, 한 개 5MB 이하 (pdf, 이미지, 문서, hwp, zip 등)`}
      >
        {keptFiles.map((f) => (
          <div className="attach-row" key={f.id}>
            <span aria-hidden>📎</span> {f.name} <span className="attach-size">{formatSize(f.size)}</span>
            <button type="button" className="btn small danger" onClick={() => setRemoved([...removed, f.id])}>
              지우기
            </button>
          </div>
        ))}
        {newFiles.map((f, idx) => (
          <div className="attach-row" key={`${f.name}-${idx}`}>
            <span aria-hidden>📎</span> {f.name} <span className="attach-size">{formatSize(f.size)} · 새로 올릴 파일</span>
            <button type="button" className="btn small" onClick={() => setNewFiles(newFiles.filter((_, n) => n !== idx))}>
              빼기
            </button>
          </div>
        ))}
        {keptFiles.length + newFiles.length < MAX_NOTICE_FILES && (
          <input
            type="file"
            multiple
            accept={NOTICE_FILE_EXTS.map((x) => "." + x).join(",")}
            value=""
            onChange={(e) => pick(e.target.files)}
          />
        )}
      </Field>
      <div className="form-actions">
        <button className="btn admin" type="submit" disabled={busy}>
          {busy ? "저장 중..." : "저장하기"}
        </button>
        <button className="btn" type="button" onClick={onCancel}>
          취소
        </button>
      </div>
    </form>
  );
}

export function EventForm({
  id,
  initial,
  onDone,
  onCancel,
}: {
  id?: number;
  initial: { title: string; content: string; start_date: string; end_date: string; link_url?: string | null };
  onDone: () => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState({ ...initial, link_url: initial.link_url ?? "" });
  const [image, setImage] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const existing = useFetch<{ has_image: boolean }>(id ? `/events/${id}` : null);
  const hasImage = !!existing.data?.has_image && !removeImage;
  const savedImageUrl = useBlobUrl(id && hasImage && !image ? `/events/${id}/image` : null);
  const previewUrl = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  const { errors, message, busy, run } = useSubmit();

  function pick(file: File | undefined) {
    if (!file) return;
    const problem = checkFiles([file], EVENT_IMAGE_EXTS, "이미지");
    setImageError(problem);
    if (!problem) setImage(file);
  }

  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        await run(async () => {
          const saved = await api<{ id: number }>(id ? `/events/${id}` : "/events", { method: id ? "PUT" : "POST", body: value });
          const eventId = id ?? saved.id;
          try {
            if (image) {
              await api(`/events/${eventId}/image`, { method: "PUT", body: { name: image.name, data: await fileToDataUrl(image) } });
            } else if (removeImage) {
              await api(`/events/${eventId}/image`, { method: "DELETE" });
            }
          } catch (err: any) {
            throw new ApiError(`이벤트는 저장됐지만 이미지에 문제가 있어요. ${err.message}`, err.status ?? 0, {});
          }
          onDone();
        });
      }}
    >
      <FormMessage message={message} errors={errors} />
      <Field label="제목" required error={errors.title}>
        <input value={value.title} maxLength={50} onChange={(e) => setValue({ ...value, title: e.target.value })} />
      </Field>
      <div className="form-grid">
        <Field label="시작일" required error={errors.start_date}>
          <input type="date" value={value.start_date} onChange={(e) => setValue({ ...value, start_date: e.target.value })} />
        </Field>
        <Field label="종료일" required error={errors.end_date}>
          <input type="date" value={value.end_date} onChange={(e) => setValue({ ...value, end_date: e.target.value })} />
        </Field>
      </div>
      <Field label="내용" required error={errors.content}>
        <textarea value={value.content} maxLength={1000} onChange={(e) => setValue({ ...value, content: e.target.value })} />
      </Field>
      <Field label="이미지" error={imageError ?? undefined} hint="jpg, png, gif, webp / 5MB 이하">
        <input type="file" accept={EVENT_IMAGE_EXTS.map((x) => "." + x).join(",")} value="" onChange={(e) => pick(e.target.files?.[0])} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {(previewUrl || savedImageUrl) && <img className="event-image" src={previewUrl ?? savedImageUrl ?? ""} alt="이벤트 이미지 미리보기" />}
        {image && (
          <button type="button" className="btn small" onClick={() => setImage(null)}>
            새 이미지 빼기
          </button>
        )}
        {id && existing.data?.has_image && !image && (
          <label style={{ fontWeight: 400, marginTop: 6 }}>
            <input
              type="checkbox"
              style={{ width: "auto", minHeight: 0, marginRight: 6 }}
              checked={removeImage}
              onChange={(e) => setRemoveImage(e.target.checked)}
            />
            등록된 이미지 지우기
          </label>
        )}
      </Field>
      <Field label="링크" error={errors.link_url} hint="누르면 새 창으로 열려요. 예: https://example.com/event">
        <input
          type="url"
          inputMode="url"
          value={value.link_url}
          maxLength={500}
          placeholder="https://"
          onChange={(e) => setValue({ ...value, link_url: e.target.value })}
        />
      </Field>
      <div className="form-actions">
        <button className="btn admin" type="submit" disabled={busy}>
          {busy ? "저장 중..." : "저장하기"}
        </button>
        <button className="btn" type="button" onClick={onCancel}>
          취소
        </button>
      </div>
    </form>
  );
}
