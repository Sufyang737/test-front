# Endpoint: Get User Products

Este endpoint permite obtener todos los productos asociados a un usuario específico utilizando su `session_name`.

## Detalles del Endpoint

- **URL**: `/api/products/user-products`
- **Método**: `GET`
- **Query Parameters**: 
  - `session_name` (requerido): Identificador de sesión del usuario

## Respuestas

### Respuesta Exitosa (200 OK)
```json
{
    "success": true,
    "products": [
        {
            "id": "string",
            "name": "string",
            "url": "string",
            "description": "string",
            "price": "string",
            "client_id": "string",
            "created": "string",
            "updated": "string"
        }
    ],
    "debug": {
        "searchedSessionId": "string",
        "foundClient": {
            "id": "string",
            "session_id": "string"
        }
    }
}
```

### Errores Posibles

- **400 Bad Request**: Cuando no se proporciona el session_name
```json
{
    "error": "session_name is required"
}
```

- **404 Not Found**: Cuando no se encuentra el cliente
```json
{
    "error": "Client not found",
    "searchedSessionId": "string"
}
```

- **403 Forbidden**: Cuando hay un problema con la autenticación
```json
{
    "error": "Error de permisos",
    "details": "Token de admin inválido o expirado"
}
```

- **500 Internal Server Error**: Para otros errores del servidor
```json
{
    "error": "Internal server error",
    "debug": {
        "searchedSessionId": "string",
        "errorDetails": {
            "status": 500,
            "data": {}
        }
    }
}
```

## Ejemplo de Uso en Python

```python
import requests

def get_user_products(session_name):
    """
    Obtiene todos los productos de un usuario específico.
    
    Args:
        session_name (str): El identificador de sesión del usuario
        
    Returns:
        dict: Respuesta JSON con los productos del usuario
        
    Raises:
        requests.exceptions.RequestException: Si hay un error en la petición
    """
    try:
        # URL del endpoint
        url = "https://tu-dominio.com/api/products/user-products"
        
        # Parámetros de la consulta
        params = {
            "session_name": session_name
        }
        
        # Realizar la petición GET
        response = requests.get(url, params=params)
        
        # Verificar si la petición fue exitosa
        response.raise_for_status()
        
        # Devolver los datos en formato JSON
        return response.json()
        
    except requests.exceptions.RequestException as e:
        print(f"Error al obtener los productos: {str(e)}")
        raise

# Ejemplo de uso
try:
    # Obtener productos para un usuario específico
    session_name = "sufyang737"
    result = get_user_products(session_name)
    
    # Procesar los productos
    if result.get("success"):
        products = result["products"]
        print(f"Se encontraron {len(products)} productos")
        
        for product in products:
            print(f"Producto: {product['name']}")
            print(f"Precio: {product['price']}")
            print(f"URL: {product['url']}")
            print("---")
    else:
        print("No se pudieron obtener los productos")
        
except Exception as e:
    print(f"Error: {str(e)}")
```

## Notas Adicionales

- El endpoint utiliza autenticación de admin internamente, por lo que no es necesario enviar tokens de autenticación en la petición.
- Los productos se limitan a 50 por petición.
- Todos los timestamps están en formato ISO 8601.
- Las URLs de los productos son URLs completas y válidas.

## Campos del Producto

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string | Identificador único del producto |
| name | string | Nombre del producto |
| url | string | URL del producto |
| description | string | Descripción del producto |
| price | string | Precio del producto |
| client_id | string | ID del cliente propietario |
| created | string | Fecha de creación (ISO 8601) |
| updated | string | Fecha de última actualización (ISO 8601) | 