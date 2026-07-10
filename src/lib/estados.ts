// Estados / provincias / regiones por país (primer nivel administrativo).
// Para países sin lista, el flujo muestra un campo de texto libre.

export const ESTADOS_POR_PAIS: Record<string, string[]> = {
  "México": [
    "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
    "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango", "Estado de México",
    "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit",
    "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí",
    "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
  ],
  "Colombia": [
    "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bogotá D.C.", "Bolívar", "Boyacá",
    "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca",
    "Guainía", "Guaviare", "Huila", "La Guajira", "Magdalena", "Meta", "Nariño",
    "Norte de Santander", "Putumayo", "Quindío", "Risaralda", "San Andrés y Providencia",
    "Santander", "Sucre", "Tolima", "Valle del Cauca", "Vaupés", "Vichada",
  ],
  "Argentina": [
    "Buenos Aires", "Ciudad Autónoma de Buenos Aires", "Catamarca", "Chaco", "Chubut",
    "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja",
    "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis",
    "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán",
  ],
  "Perú": [
    "Amazonas", "Áncash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca", "Callao",
    "Cusco", "Huancavelica", "Huánuco", "Ica", "Junín", "La Libertad", "Lambayeque",
    "Lima", "Loreto", "Madre de Dios", "Moquegua", "Pasco", "Piura", "Puno",
    "San Martín", "Tacna", "Tumbes", "Ucayali",
  ],
  "Chile": [
    "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo", "Valparaíso",
    "Región Metropolitana", "O'Higgins", "Maule", "Ñuble", "Biobío", "La Araucanía",
    "Los Ríos", "Los Lagos", "Aysén", "Magallanes",
  ],
  "Ecuador": [
    "Azuay", "Bolívar", "Cañar", "Carchi", "Chimborazo", "Cotopaxi", "El Oro", "Esmeraldas",
    "Galápagos", "Guayas", "Imbabura", "Loja", "Los Ríos", "Manabí", "Morona Santiago",
    "Napo", "Orellana", "Pastaza", "Pichincha", "Santa Elena", "Santo Domingo",
    "Sucumbíos", "Tungurahua", "Zamora Chinchipe",
  ],
  "Venezuela": [
    "Amazonas", "Anzoátegui", "Apure", "Aragua", "Barinas", "Bolívar", "Carabobo", "Cojedes",
    "Delta Amacuro", "Distrito Capital", "Falcón", "Guárico", "Lara", "Mérida", "Miranda",
    "Monagas", "Nueva Esparta", "Portuguesa", "Sucre", "Táchira", "Trujillo", "Vargas",
    "Yaracuy", "Zulia",
  ],
  "Guatemala": [
    "Alta Verapaz", "Baja Verapaz", "Chimaltenango", "Chiquimula", "El Progreso", "Escuintla",
    "Guatemala", "Huehuetenango", "Izabal", "Jalapa", "Jutiapa", "Petén", "Quetzaltenango",
    "Quiché", "Retalhuleu", "Sacatepéquez", "San Marcos", "Santa Rosa", "Sololá",
    "Suchitepéquez", "Totonicapán", "Zacapa",
  ],
  "España": [
    "Andalucía", "Aragón", "Asturias", "Islas Baleares", "Canarias", "Cantabria",
    "Castilla-La Mancha", "Castilla y León", "Cataluña", "Extremadura", "Galicia",
    "La Rioja", "Comunidad de Madrid", "Región de Murcia", "Navarra", "País Vasco",
    "Comunidad Valenciana",
  ],
  "Estados Unidos": [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Carolina del Norte",
    "Carolina del Sur", "Colorado", "Connecticut", "Dakota del Norte", "Dakota del Sur",
    "Delaware", "Florida", "Georgia", "Hawái", "Idaho", "Illinois", "Indiana", "Iowa",
    "Kansas", "Kentucky", "Luisiana", "Maine", "Maryland", "Massachusetts", "Míchigan",
    "Minnesota", "Misisipi", "Misuri", "Montana", "Nebraska", "Nevada", "Nueva Jersey",
    "Nueva York", "Nuevo Hampshire", "Nuevo México", "Ohio", "Oklahoma", "Oregón",
    "Pensilvania", "Rhode Island", "Tennessee", "Texas", "Utah", "Vermont", "Virginia",
    "Virginia Occidental", "Washington", "Washington D.C.", "Wisconsin", "Wyoming",
  ],
  "Bolivia": [
    "Beni", "Chuquisaca", "Cochabamba", "La Paz", "Oruro", "Pando", "Potosí",
    "Santa Cruz", "Tarija",
  ],
  "República Dominicana": [
    "Distrito Nacional", "Santo Domingo", "Santiago", "La Vega", "San Cristóbal",
    "Puerto Plata", "La Altagracia", "Duarte", "Espaillat", "Azua", "Barahona", "Otra",
  ],
};

export function estadosDe(pais: string | null): string[] | null {
  if (!pais) return null;
  return ESTADOS_POR_PAIS[pais] ?? null;
}
