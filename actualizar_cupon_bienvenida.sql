-- Ejecutar en Supabase > SQL Editor.
-- Recomendado: hacer primero un backup/export de las tablas cupones y cupones_usos.

begin;

-- Desactivar el cupón anterior del 10%.
update public.cupones
set activo = false
where codigo = 'CUPON10';

-- Conservar el historial de usos del código anterior de bienvenida.
-- Si ya existe un uso BIENVENIDA para esa cuenta, no duplicamos la fila.
delete from public.cupones_usos old_use
where old_use.codigo = 'BIENVENIDA5'
  and exists (
    select 1
    from public.cupones_usos new_use
    where new_use.user_id = old_use.user_id
      and new_use.codigo = 'BIENVENIDA'
  );

update public.cupones_usos
set codigo = 'BIENVENIDA'
where codigo = 'BIENVENIDA5';

-- Si existe BIENVENIDA5 y todavía no existe BIENVENIDA, renombrarlo.
update public.cupones
set codigo = 'BIENVENIDA',
    tipo = 'porcentaje',
    valor = 5,
    compra_minima = 0,
    activo = true
where codigo = 'BIENVENIDA5'
  and not exists (
    select 1 from public.cupones c2 where c2.codigo = 'BIENVENIDA'
  );

-- Si BIENVENIDA ya existía, dejarlo configurado como 5%.
update public.cupones
set tipo = 'porcentaje',
    valor = 5,
    compra_minima = 0,
    activo = true
where codigo = 'BIENVENIDA';

-- Si quedó una fila antigua con el código previo, apagarla.
update public.cupones
set activo = false
where codigo = 'BIENVENIDA5';

-- Si ninguno de los dos existía, crear el cupón.
insert into public.cupones (codigo, tipo, valor, compra_minima, activo, usos)
select 'BIENVENIDA', 'porcentaje', 5, 0, true, 0
where not exists (
  select 1 from public.cupones where codigo = 'BIENVENIDA'
);

commit;

-- Verificación:
select codigo, tipo, valor, activo, usos
from public.cupones
where codigo in ('BIENVENIDA', 'BIENVENIDA5', 'CUPON10')
order by codigo;
