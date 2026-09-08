/**
 * Preparación común de la suite.
 *
 * Las pantallas se apartan de la barra de navegación del móvil leyendo el área
 * segura del dispositivo. Fuera del móvil eso no existe, así que se usa el mock
 * que trae la propia librería: sin `SafeAreaProvider` alrededor devuelve márgenes
 * a cero —que es lo que quiere la mayoría de los tests, ajenos a este asunto— y,
 * cuando un test sí envuelve la pantalla en un `SafeAreaProvider`, respeta los
 * márgenes que ese test declare.
 */

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);
