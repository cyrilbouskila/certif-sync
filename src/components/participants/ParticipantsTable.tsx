"use client"

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function ParticipantsTable({ participants }: { participants: any[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Société</TableHead>
          <TableHead>Ajouté par</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {participants.map((p) => (
          <TableRow key={p.id}>
            <TableCell>{p.first_name} {p.last_name}</TableCell>
            <TableCell>{p.email}</TableCell>
            <TableCell>{p.company}</TableCell>
            <TableCell>{p.added_by}</TableCell>
            <TableCell><Badge>{p.status}</Badge></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
