namespace albums_api.Models
{
    public record Album(int Id, string Title, string Artist, double Price, string Image_url, int Year)
    {
        private static readonly List<Album> Albums = new()
        {
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

        public static List<Album> GetAll()
        {
            return Albums.ToList();
        }

        public static Album? GetById(int id)
        {
            return Albums.FirstOrDefault(a => a.Id == id);
        }

        public static Album Add(string title, string artist, double price, string imageUrl)
        {
            var album = new Album(
                Albums.Count == 0 ? 1 : Albums.Max(a => a.Id) + 1,
                title,
                artist,
                price,
                imageUrl,
                0);

            Albums.Add(album);
            return album;
        }

        public static Album? Update(int id, string title, string artist, double price, string imageUrl)
        {
            var index = Albums.FindIndex(album => album.Id == id);
            if (index < 0)
            {
                return null;
            }

            var album = new Album(id, title, artist, price, imageUrl, Albums[index].Year);
            Albums[index] = album;
            return album;
        }

        public static bool Delete(int id)
        {
            var album = Albums.FirstOrDefault(item => item.Id == id);
            return album is not null && Albums.Remove(album);
        }
    }
}
