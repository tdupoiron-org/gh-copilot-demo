namespace albums_api.Models
{
    public record Album(int Id, string Title, string Artist, double Price, string Image_url, int Year)
    {
        public static List<Album> GetAll()
        {
            var albums = new List<Album>(){
            new Album(1, "You, Me and an App Id", "Daprize", 10.99, "https://aka.ms/albums-daprlogo", 2022),
            new Album(2, "Seven Revision Army", "The Blue-Green Stripes", 13.99, "https://aka.ms/albums-containerappslogo", 2021),
            new Album(3, "Scale It Up", "KEDA Club", 13.99, "https://aka.ms/albums-kedalogo", 2020),
            new Album(4, "Lost in Translation", "MegaDNS", 12.99,"https://aka.ms/albums-envoylogo", 2019),
            new Album(5, "Lock Down Your Love", "V is for VNET", 12.99, "https://aka.ms/albums-vnetlogo", 2018),
            new Album(6, "Sweet Container O' Mine", "Guns N Probeses", 14.99, "https://aka.ms/albums-containerappslogo", 2023),
            new Album(7, "Girtodian", "Kubernetes", 11.99, "https://aka.ms/albums-kuberneteslogo", 2017),
            new Album(8, "Helm Bells", "The Chart Toppers", 9.99, "https://aka.ms/albums-helmlogo", 2016),
            new Album(9, "Ingress of Fire", "NGINX Nation", 15.99, "https://aka.ms/albums-nginxlogo", 2024),
            new Album(10, "Service Mesh Serenade", "Istio Islanders", 14.49, "https://aka.ms/albums-istiologo", 2025)
         };

            return albums;
        }

        public static Album? GetById(int id)
        {
            var albums = GetAll();
            return albums.FirstOrDefault(a => a.Id == id);
        } 
    }
}
