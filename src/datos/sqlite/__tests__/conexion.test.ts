import { abrirConNodeSqlite, rutaDeFicheroDePrueba } from '../../../pruebas/bdDePrueba';
import { abrirBaseDeDatos, FICHERO_BASE_DE_DATOS } from '../conexion';

describe('Apertura de la base de datos', () => {
  it('la interfaz BaseDeDatos ejecuta, escribe y lee contra SQLite de verdad', () => {
    const bd = abrirConNodeSqlite(':memory:');

    bd.ejecutar('CREATE TABLE prueba (id INTEGER PRIMARY KEY AUTOINCREMENT, texto TEXT)');
    const escritura = bd.escribir('INSERT INTO prueba (texto) VALUES (?)', 'hola');

    expect(escritura).toEqual({ ultimoId: 1, filasAfectadas: 1 });
    expect(bd.leer('SELECT texto FROM prueba WHERE id = ?', 1)).toEqual([{ texto: 'hola' }]);

    bd.cerrar();
  });

  it('deja las claves ajenas activadas en cada apertura', () => {
    const bd = abrirBaseDeDatos(abrirConNodeSqlite, ':memory:');

    expect(bd.leer('PRAGMA foreign_keys')).toEqual([{ foreign_keys: 1 }]);

    bd.cerrar();
  });

  it('dos aperturas seguidas del mismo fichero dan la misma base con los mismos datos', () => {
    const fichero = rutaDeFicheroDePrueba();

    const primera = abrirBaseDeDatos(abrirConNodeSqlite, fichero);
    primera.ejecutar('CREATE TABLE prueba (texto TEXT)');
    primera.escribir('INSERT INTO prueba (texto) VALUES (?)', 'sigo aquí');
    primera.cerrar();

    const segunda = abrirBaseDeDatos(abrirConNodeSqlite, fichero);

    expect(segunda.leer('SELECT texto FROM prueba')).toEqual([{ texto: 'sigo aquí' }]);
    expect(segunda.leer('PRAGMA foreign_keys')).toEqual([{ foreign_keys: 1 }]);

    segunda.cerrar();
  });

  it('el nombre del fichero no alude a la app, al local ni al responsable', () => {
    // El nombre comercial de la app, el del local y el del responsable son datos que
    // el encargado edita: ninguno puede quedar fijado en código, tampoco aquí.
    expect(FICHERO_BASE_DE_DATOS).toBe('plantilla.db');
  });
});
