# Cult of the Lamb → terrario (investigación jugable)

Fuente: wiki de Cult of the Lamb (Faith, Followers, Loyalty, Devotion, Rituals). Qué hace el juego y cómo quedó aquí.

| Cult of the Lamb | Detalle del juego | Terrario |
|---|---|---|
| Fe del culto | Cada evento con su cifra: sermón +10, bendecir +5, inspirar +7, nuevo miembro +5, edificio +2, decoración +4, cruzada +10, morir en cruzada −10, faltan camas −20, hambrientos −10, despertar de noche −5, rechazar petición −25, cumplirla +20. Baja sola. | `home.faith` con las mismas cifras (`src/data/cult.js`), se suma a la calma y sale como número flotante. |
| Lealtad | Barra 0–100 por seguidor; al llenarla sube de nivel y da recompensa (20 devoción + fragmento). | `iso.loyal`/`iso.lv`; al subir: +1 ámbar, +5 fe y más vida en la expedición. |
| Bendecir | Una vez por día por seguidor. | **Mimo** en la ficha del isópodo. |
| Sermón | Una vez por día; la colonia se reúne en el templo. | **Reunir** en Colonia: se juntan en círculo junto al altar (o refugio), botan mirando al centro y ganan lealtad. |
| Peticiones | Globo de pensamiento con lo que quiere; plazo; cumplir +20, fallar −25/−45. | Globito teal sobre la cabeza (pieza, humedad, comer, mimo) con plazo de 5 min. |
| Noche | Los seguidores duermen en sus refugios; sin cama bajan la fe. | De noche van solos a una cama libre; sin cama se hacen un ovillo y la fe baja al anochecer. |
| Construcción | Lo que pones queda como obra; los seguidores la levantan. | Las piezas nuevas son obras que no funcionan hasta acabar; hasta 2 isópodos libres van y martillean (×3 de ritmo). |
| Asignar seguidor | Aserradero o cantera con un seguidor trabajando. | **Trabajar** en la ficha: se queda junto a la pieza que produce más cerca, +75 % por trabajador (máx. 2). |
| Cruzada: rescate | Seguidores cautivos que se salvan peleando. | Sala **Rescate**: pelea y el cautivo se une al volver (se pierde si caéis). |
| Cruzada: tiendas | Mercaderes dentro de la mazmorra. | Sala **Tienda**: cambia botín por gota, hongo o curación. |
| Cruzada: curarse | Corazones y salas de descanso. | Sala **Fuente**: +35 % de vida a todos. |
| Morir | Vuelves a la base perdiendo parte de lo recogido. | Ya estaba: al caer se pierde la mitad del botín y los rescatados. |
| Armas | Espada, hacha (×0,5 vel.), daga (×2, 5 golpes), guanteletes (3.º ×3), martillo (1 golpe ×4); variantes Bane, Vampiric, Merciless, Godly. | `src/data/weapons.js`: pinza, mandíbula, aguijón, garras, maza; venenosa, vampírica, despiadada, divina. Se elige entre 2 (3 con el armero) al entrar; pedestales para cambiar. |
| Vellones | Golden (+5 % por muerte, daño ×2), Glass Cannon, Fates (4 cartas, sin más), Hobbled Heels (cura por sala, sin rodar), Berserker. | `src/data/robes.js`: dorado, cristal, destino, tozudo, berserker; se compran con ámbar y se eligen al partir. |
| Rasgos | Obediente, Industrioso, Crédulo, Escéptico, Perezoso, Cínico… nacen con ellos. | `src/data/traits.js`: 12 rasgos con efectos en fe, lealtad, trabajo, hambre, vida y susto. |
| Comerciantes y mejoras | Ratau y tiendas; Inspiración divina con devoción. | Mercader cada 3 días (`src/data/economy.js`) y 5 mejoras con ámbar. |
| Altares malditos | Pactos con riesgo en la mazmorra. | Sala **Altar**: carta rara a cambio de un 25 % de vida. |
| Tarot | Cartas que tocan armas, curas y críticos. | 6 cartas nuevas: furia, eco, savia, sangría, filo, remate. |
| Tutoriales | Avisos la primera vez de cada cosa. | `src/data/tips.js`: 11 consejos de una vez, apagables en Ajustes. |
