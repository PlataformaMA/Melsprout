import { resumenMarketplace } from "@/lib/mkt-admin";
import { MktInicio } from "@/components/MktInicio";

export default async function MarketplaceInicioPage() {
  const r = await resumenMarketplace();

  // El layout de arriba ya corrió el candado: si aquí viene vacío es porque
  // una consulta se cayó, no porque la persona no tenga permiso.
  if (!r) {
    return (
      <div className="bg-surface border border-dashed border-border rounded-3xl p-10 text-center">
        <h1 className="font-display font-extrabold text-[16px]">No pudimos armar el resumen</h1>
        <p className="text-sub text-[13.5px] mt-1.5">Recarga la página; si sigue igual, revisa el log del servidor.</p>
      </div>
    );
  }

  return <MktInicio r={r} />;
}
