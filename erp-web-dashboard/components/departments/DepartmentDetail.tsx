"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/arc/alert/alert";
import { Avatar } from "@/components/arc/avatar/avatar";
import { AvatarGroup } from "@/components/arc/avatar-group/avatar-group";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { Combobox } from "@/components/arc/combobox/combobox";
import { ConfirmMorph } from "@/components/arc/confirm-morph/confirm-morph";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { HoldToConfirm } from "@/components/arc/hold-to-confirm/hold-to-confirm";
import { Input } from "@/components/arc/input/input";
import { Card } from "@/components/ui/Card";
import { Muted, PageHeader } from "@/components/ui/Table";
import { useBreadcrumbTrail } from "@/lib/breadcrumbs";
import { resolveActiveCompany } from "@/lib/company";
import { deleteDepartment, fetchDepartmentMembers, fetchDepartments } from "@/lib/departments";
import type { DepartmentMember, DepartmentRow } from "@/lib/departments";
import { STATUS_LABEL, TYPE_LABEL, assignDepartment, fetchEmployees } from "@/lib/people";
import type { EmployeeRow } from "@/lib/people";
import { createPosition, deletePosition, fetchPositions, updatePosition } from "@/lib/positions";
import type { PositionRow } from "@/lib/positions";

const STATUS_TONE = { active: "success", inactive: "warning", resigned: "neutral" } as const;

/**
 * One form for the whole department: positions are created here, and the member
 * picker assigns a person to a position in the same submit. The member list
 * shows the resulting pairing.
 */
export function DepartmentDetail({ departmentId }: { departmentId: string }) {
  const router = useRouter();
  const [department, setDepartment] = useState<DepartmentRow | null>(null);
  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [pool, setPool] = useState<EmployeeRow[]>([]);
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  const [newPosition, setNewPosition] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const [memberId, setMemberId] = useState("");
  const [memberPositionId, setMemberPositionId] = useState("");

  useBreadcrumbTrail(department ? [department.name] : []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const company = await resolveActiveCompany();
        if (!company) {
          if (alive) setLoading(false);
          return;
        }
        const [list, roster, employees, positionList] = await Promise.all([
          fetchDepartments(company.id),
          fetchDepartmentMembers(departmentId),
          fetchEmployees(company.id).catch(() => []),
          fetchPositions(departmentId).catch(() => []),
        ]);
        if (!alive) return;
        setDepartment(list.find((item) => item.id === departmentId) ?? null);
        setMembers(roster);
        setPool(employees);
        setPositions(positionList);
      } catch (caught) {
        if (alive) setError(caught instanceof Error ? caught.message : "Gagal memuat departemen.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [departmentId, reload]);

  const candidates = useMemo(
    () => pool.filter((employee) => employee.departmentId !== departmentId && employee.status !== "resigned"),
    [pool, departmentId]
  );
  const selectedMember = candidates.find((employee) => employee.id === memberId) ?? null;
  const selectedPosition = positions.find((position) => position.id === memberPositionId) ?? null;

  async function addPosition() {
    if (newPosition.trim().length < 2) {
      setError("Nama posisi minimal 2 karakter.");
      return;
    }
    setBusy("new-position");
    try {
      await createPosition(departmentId, newPosition.trim());
      setNewPosition("");
      setError(null);
      setReload((value) => value + 1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menambah posisi.");
    } finally {
      setBusy(null);
    }
  }

  async function savePosition(position: PositionRow) {
    if (editName.trim().length < 2) return;
    setBusy(position.id);
    try {
      await updatePosition(position.id, { name: editName.trim(), isActive: position.isActive });
      setEditingId(null);
      setError(null);
      setReload((value) => value + 1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menyimpan posisi.");
    } finally {
      setBusy(null);
    }
  }

  async function removePosition(positionId: string) {
    try {
      await deletePosition(positionId);
      setError(null);
      setReload((value) => value + 1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menghapus posisi.");
    }
  }

  async function addMember() {
    if (!memberId) return;
    setBusy(memberId);
    try {
      await assignDepartment(memberId, departmentId, memberPositionId || null);
      setMemberId("");
      setMemberPositionId("");
      setError(null);
      setReload((value) => value + 1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menambah anggota.");
    } finally {
      setBusy(null);
    }
  }

  async function removeMember(employeeId: string) {
    setBusy(employeeId);
    try {
      await assignDepartment(employeeId, null, null);
      setError(null);
      setReload((value) => value + 1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal mengeluarkan anggota.");
    } finally {
      setBusy(null);
    }
  }

  async function removeDepartment() {
    try {
      await deleteDepartment(departmentId);
      router.push("/human-resources/departemen");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menghapus departemen.");
    }
  }

  if (loading) {
    return <Muted>Memuat departemen…</Muted>;
  }

  if (!department) {
    return (
      <EmptyState
        title="Departemen tidak ditemukan"
        description={`Tidak ada departemen dengan id ${departmentId}.`}
        action={
          <Link href="/human-resources/departemen">
            <Button variant="secondary">Kembali ke daftar</Button>
          </Link>
        }
      />
    );
  }

  const activePositions = positions.filter((position) => position.isActive);

  return (
    <>
      <PageHeader
        title={department.name}
        description={`${department.code} · ${positions.length} posisi · ${members.length} anggota`}
        aside={
          <>
            <Badge tone={department.isActive ? "success" : "neutral"} dot pill>
              {department.isActive ? "aktif" : "nonaktif"}
            </Badge>
            <Link href="/human-resources/departemen">
              <Button size="sm" variant="secondary">
                Kembali
              </Button>
            </Link>
            <Link href={`/human-resources/departemen/${department.id}/edit`}>
              <Button size="sm">Ubah</Button>
            </Link>
          </>
        }
      />

      {error ? <Alert tone="danger" title={error} /> : null}

      <Card
        title="Posisi & anggota"
        description="Buat posisi lebih dulu, lalu tugaskan karyawan ke posisi itu dari picker yang sama."
        meta="Satu form"
        status={`${positions.length} posisi · ${members.length} anggota`}
      >
        <div className="dept-layout">
          <section className="form-section">
            <div className="form-section__head">
              <h3 className="form-section__title">Posisi</h3>
              <Muted>{positions.length ? `${positions.length} posisi` : "belum ada"}</Muted>
            </div>

            <div className="dept-inline">
              <Input
                label="Nama posisi"
                value={newPosition}
                onChange={(event) => setNewPosition(event.target.value)}
                placeholder="Kepala Gudang"
              />
              <Button onClick={addPosition} loading={busy === "new-position"}>
                Tambah posisi
              </Button>
            </div>

            {positions.length ? (
              <div className="dept-table">
                {positions.map((position) => {
                  const assigned = members.filter((member) => member.positionId === position.id).length;
                  return (
                    <div key={position.id} className={editingId === position.id ? "dept-pos dept-pos--editing" : "dept-pos"}>
                      {editingId === position.id ? (
                        <>
                          <Input
                            label="Ubah posisi"
                            value={editName}
                            onChange={(event) => setEditName(event.target.value)}
                          />
                          <div className="dept-pos__actions">
                            <Button size="sm" loading={busy === position.id} onClick={() => savePosition(position)}>
                              Simpan
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                              Batal
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="emp-person__text">
                            <span className="emp-person__name">{position.name}</span>
                            <span className="emp-person__meta">
                              {position.isActive ? "aktif" : "nonaktif"} · {assigned} anggota
                            </span>
                          </span>
                          <div className="dept-pos__actions">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingId(position.id);
                                setEditName(position.name);
                              }}
                            >
                              Ubah
                            </Button>
                            <ConfirmMorph
                              label="Hapus"
                              prompt={`Hapus ${position.name}?`}
                              confirmLabel="Hapus"
                              pendingLabel="Menghapus…"
                              onConfirm={() => removePosition(position.id)}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="dept-empty">Belum ada posisi. Tambahkan satu supaya anggota bisa ditempatkan.</p>
            )}
          </section>

          <section className="form-section">
            <div className="form-section__head">
              <h3 className="form-section__title">Anggota</h3>
              {members.length ? (
                <span className="dept-stack">
                  <AvatarGroup
                    members={members.slice(0, 6).map((member) => ({
                      name: member.fullName,
                      src: member.photo ?? undefined,
                    }))}
                    max={6}
                    size="sm"
                    label={`${members.length} anggota ${department.name}`}
                  />
                  <Muted>{members.length} karyawan</Muted>
                </span>
              ) : (
                <Muted>belum ada</Muted>
              )}
            </div>

            {candidates.length ? (
              <div className="dept-pick">
                <div className="dept-pick__fields">
                  <Combobox
                    label="Karyawan"
                    options={candidates.map((employee) => ({
                      value: employee.id,
                      label: `${employee.fullName} · ${employee.employeeCode}`,
                    }))}
                    value={memberId}
                    onValueChange={setMemberId}
                    placeholder="Cari nama atau kode…"
                    emptyMessage="Tidak ada karyawan yang cocok."
                  />
                  <Combobox
                    label="Posisi"
                    options={[
                      { value: "", label: "Tanpa posisi" },
                      ...activePositions.map((position) => ({ value: position.id, label: position.name })),
                    ]}
                    value={memberPositionId}
                    onValueChange={setMemberPositionId}
                    placeholder="Tanpa posisi"
                    emptyMessage="Belum ada posisi aktif."
                  />
                  <Button onClick={addMember} loading={busy === memberId} disabled={!memberId}>
                    Tambah anggota
                  </Button>
                </div>

                {selectedMember ? (
                  <div className="dept-pick__preview">
                    <Avatar name={selectedMember.fullName} src={selectedMember.photo ?? undefined} size="sm" />
                    <span className="emp-person__text">
                      <span className="emp-person__name">{selectedMember.fullName}</span>
                      <span className="emp-person__meta">
                        {selectedMember.employeeCode} · {TYPE_LABEL[selectedMember.type] ?? selectedMember.type}
                      </span>
                    </span>
                    <Badge size="sm" tone={selectedPosition ? "info" : "neutral"}>
                      {selectedPosition ? selectedPosition.name : "tanpa posisi"}
                    </Badge>
                  </div>
                ) : (
                  <p className="dept-hint">Pilih karyawan dan posisinya, lalu tambahkan.</p>
                )}
              </div>
            ) : (
              <p className="dept-empty">Semua karyawan aktif sudah ada di departemen ini.</p>
            )}

            {members.length ? (
              <div className="dept-table">
                <div className="dept-member dept-member--head">
                  <span>Karyawan</span>
                  <span>Posisi</span>
                  <span className="dept-member__type">Tipe</span>
                  <span className="dept-member__status">Status</span>
                  <span aria-hidden="true" />
                </div>
                {members.map((member) => (
                  <div key={member.id} className="dept-member">
                    <Link href={`/human-resources/karyawan/${member.id}`} className="emp-person">
                      <Avatar name={member.fullName} src={member.photo ?? undefined} size="sm" />
                      <span className="emp-person__text">
                        <span className="emp-person__name">{member.fullName}</span>
                        <span className="emp-person__meta">{member.employeeCode}</span>
                      </span>
                    </Link>
                    <span className="emp-cell">{member.positionName ?? "tanpa posisi"}</span>
                    <span className="emp-cell dept-member__type">
                      {TYPE_LABEL[member.type] ?? member.type}
                    </span>
                    <span className="dept-member__status">
                      <Badge size="sm" dot tone={STATUS_TONE[member.status] ?? "neutral"}>
                        {STATUS_LABEL[member.status] ?? member.status}
                      </Badge>
                    </span>
                    <span className="dept-member__actions">
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={busy === member.id}
                        onClick={() => removeMember(member.id)}
                      >
                        Keluarkan
                      </Button>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="dept-empty">Belum ada anggota. Tambahkan dari picker di atas.</p>
            )}
          </section>
        </div>
      </Card>

      <Card
        title="Hapus departemen"
        description="Karyawan tetap tersimpan; hanya penempatan departemennya yang dikosongkan."
        meta="Tidak bisa dibatalkan"
      >
        <HoldToConfirm
          label="Tahan untuk hapus departemen"
          confirmedLabel="Departemen dihapus"
          duration={1200}
          tone="danger"
          onConfirm={removeDepartment}
        />
      </Card>
    </>
  );
}