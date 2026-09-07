namespace albums_api.Models
{
    public record Album(int Id, string Title, string Artist, double Price, string Image_url)
    {
        private static readonly List<Album> Albums = new()
        {
            new Album(1, "You, Me and an App Id", "Daprize", 10.99, "https://aka.ms/albums-daprlogo"),
            new Album(2, "Seven Revision Army", "The Blue-Green Stripes", 13.99, "https://aka.ms/albums-containerappslogo"),
            new Album(3, "Scale It Up", "KEDA Club", 13.99, "https://aka.ms/albums-kedalogo"),
            new Album(4, "Lost in Translation", "MegaDNS", 12.99,"https://aka.ms/albums-envoylogo"),
            new Album(5, "Lock Down Your Love", "V is for VNET", 12.99, "https://aka.ms/albums-vnetlogo"),
            new Album(6, "Sweet Container O' Mine", "Guns N Probeses", 14.99, "https://aka.ms/albums-containerappslogo")
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
                imageUrl);

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

            var album = new Album(id, title, artist, price, imageUrl);
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
