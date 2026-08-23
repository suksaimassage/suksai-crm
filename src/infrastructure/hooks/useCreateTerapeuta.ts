import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseUsuarioAdapter } from '@infra/adapters/SupabaseUsuarioAdapter';
import { SupabaseRolAdapter } from '@infra/adapters/SupabaseRolAdapter';
import { SupabaseUsuarioCentroAdapter } from '@infra/adapters/SupabaseUsuarioCentroAdapter';
import { UsuarioService } from '@domain/services/UsuarioService';
import type { TCentroId } from '@domain/types';

const usuarioAdapter = new SupabaseUsuarioAdapter();
const rolAdapter = new SupabaseRolAdapter();
const usuarioCentroAdapter = new SupabaseUsuarioCentroAdapter();
// pattern from mem-search: module-scope service composition root (e.g. CitaService, UsuarioService)
const usuarioService = new UsuarioService({
  usuarioRepository: usuarioAdapter,
  rolRepository: rolAdapter,
});

interface ICreateTerapeutaInput {
  readonly nombre: string;
  readonly apellidos?: string;
  readonly email: string;
  readonly telefono?: string;
  readonly centroIds: readonly TCentroId[];
  readonly principalCentroId?: TCentroId | null;
  readonly rolNombre: string;
}

export function useCreateTerapeuta() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: ICreateTerapeutaInput) => {
      // Step 1 — resolve the user-selected role ID
      const roles = await rolAdapter.findAll();
      const selectedRol = roles.find((r) => r.nombre === input.rolNombre);
      if (selectedRol === undefined) {
        throw new Error(`El rol "${input.rolNombre}" no existe en la base de datos.`);
      }

      // Step 2 — create the usuario via UsuarioService (validates Email VO + duplicate check)
      const usuario = await usuarioService.create({
        nombre: input.nombre,
        apellidos: input.apellidos ?? '',
        email: input.email,
        telefono: input.telefono,
      });

      // Step 3 — assign selected role
      try {
        await rolAdapter.assignRolToUsuario(usuario.id, selectedRol.id);
      } catch (roleErr) {
        // Partial write — role assignment failed; surface granular error
        throw new Error(
          `Usuario creado (id=${String(usuario.id)}) pero no se pudo asignar el rol: ${String(roleErr)}`,
          { cause: roleErr },
        );
      }

      // Step 4 — assign to each centro. The principal centro is assigned with
      // esPrincipal=true directly (adapter supports the 3rd arg), avoiding a
      // separate setPrincipal call that could partially fail.
      const centroErrors: string[] = [];
      await Promise.all(
        input.centroIds.map((centroId) =>
          usuarioCentroAdapter
            .assign(usuario.id, centroId, centroId === input.principalCentroId)
            .catch((err: unknown) => {
              centroErrors.push(`centro ${String(centroId)}: ${String(err)}`);
            }),
        ),
      );
      if (centroErrors.length > 0) {
        throw new Error(`Terapeuta creado pero con errores en centros: ${centroErrors.join(', ')}`);
      }

      return usuario;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['terapeutas'] });
    },
  });
}
