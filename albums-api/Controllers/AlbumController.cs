using albums_api.Models;
using Microsoft.AspNetCore.Mvc;
using System.Net;
using System.Text.Json;
using System.Text;

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

            if (album == null)
            {
                return NotFound();
            }

            return Ok(album);
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

    }
}
