import pymysql

# Dòng này là để "lừa" Django rằng phiên bản là 2.2.1
pymysql.version_info = (2, 2, 1, "final", 0)

pymysql.install_as_MySQLdb()