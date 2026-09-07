using albums_api.Models;
using Microsoft.AspNetCore.Mvc;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace albums_api.Controllers
{
    [Route("albums")]
    [ApiController]
    public class AlbumController : ControllerBase
    {
        // GET: api/album
        [HttpGet]
        public IActionResult Get()
        {
            var albums = Album.GetAll();

            return Ok(albums);
        }

        // GET api/<AlbumController>/5
        [HttpGet("{id}")]
        public IActionResult Get(int id)
        {
            var album = Album.GetById(id);
            return album is null ? NotFound() : Ok(album);
        }

        // GET: albums/sort?sortBy=title|artist|price
        [HttpGet("sort")]
        public IActionResult GetSorted([FromQuery] string? sortBy)
        {
            var albums = Album.GetAll();
            IEnumerable<Album> sortedAlbums = sortBy?.Trim().ToLowerInvariant() switch
            {
                "title" => albums.OrderBy(a => a.Title),
                "artist" => albums.OrderBy(a => a.Artist),
                "price" => albums.OrderBy(a => a.Price),
                _ => albums
            };

            return Ok(sortedAlbums);
        }

        [HttpPost]
        public IActionResult Post([FromBody] AlbumRequest request)
        {
            if (!IsValid(request))
            {
                return BadRequest("Title, artist, image URL, and a non-negative price are required.");
            }

            var album = Album.Add(request.Title, request.Artist, request.Price, request.ImageUrl);
            return CreatedAtAction(nameof(Get), new { id = album.Id }, album);
        }

        [HttpPut("{id}")]
        public IActionResult Put(int id, [FromBody] AlbumRequest request)
        {
            if (!IsValid(request))
            {
                return BadRequest("Title, artist, image URL, and a non-negative price are required.");
            }

            var album = Album.Update(id, request.Title, request.Artist, request.Price, request.ImageUrl);
            return album is null ? NotFound() : Ok(album);
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            return Album.Delete(id) ? NoContent() : NotFound();
        }

        private static bool IsValid(AlbumRequest request)
        {
            return !string.IsNullOrWhiteSpace(request.Title)
                && !string.IsNullOrWhiteSpace(request.Artist)
                && !string.IsNullOrWhiteSpace(request.ImageUrl)
                && request.Price >= 0;
        }

        public record AlbumRequest(string Title, string Artist, double Price, string ImageUrl);
    }
}
