import unittest,csv,io
from import_prices import parse
def sample(title,year=2026,month='Julio'):
    stream=io.StringIO()
    w=csv.writer(stream,delimiter=';')
    w.writerow([title])
    w.writerow(['Id','Producto','Tipo','Precio','Mes','Año','establecimiento'])
    for i in range(101):
        w.writerow([str(i+1),'Test product '+str(i),'Libra','10.50',month,str(year),'mercados'])
    w.writerow(['999','Bad future entry','Libra','10.50',month,'2099','mercados'])
    return stream.getvalue().encode()
class ImportTests(unittest.TestCase):
    def test_declared_range(self):
        self.assertEqual(len(parse(sample('Julio - Septiembre del 2026'))),101)
    def test_different_range(self):
        self.assertEqual(len(parse(sample('Enero - Marzo del 2025',2025,'Enero'))),101)
    def test_unrecognized_title(self):
        with self.assertRaises(ValueError): parse(sample('Unknown period'))
    def test_future_title(self):
        with self.assertRaises(ValueError): parse(sample('Julio - Septiembre del 2099',2099))
    def test_wrong_period(self):
        with self.assertRaises(ValueError): parse(sample('Julio - Septiembre del 2026',2025))
if __name__=='__main__': unittest.main()
