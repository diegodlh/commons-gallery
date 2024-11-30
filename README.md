# Wikimedia Commons category gallery viewer

[Wikimedia Commons](https://commons.wikimedia.org/) is a great openly-licensed media repository. However, it's interface is not very friendly.

There are some alternatives, like the [Category Slideshow gadget](https://commons.wikimedia.org/wiki/Help:Gadget-GallerySlideshow), but the user must know about them and they are still quite limited.

When I took photos for the [2024 IGLA+ Championship](https://commons.wikimedia.org/wiki/Category:2024_IGLA%2B_Championship) I wanted to have a simple way to share them with the participants (most of whom are not familiar with Wikimedia Commons), that would work nicely on mobile.

This [Wikimedia Commons category gallery viewer](https://diegodlh.github.io/commons-gallery/) is a very basic prototype of that idea.

![commons-gallery](https://github.com/user-attachments/assets/9e563644-df58-4dfd-997a-b8174814f8d3)

## Features

Some of its features include:
* Enter a Wikimedia Commons category name and click fetch to show the gallery.
* Share the custom URL with others.
* Click on Load more to keep loading more images in the same category.
* Choose whether to sort by image name or creation date (uses image EXIF metadata or upload date if not available).
* Hover an image to see its tilte and click to open it on Wikimedia Commons.
* Move the slider to change the size of the thumbnails.

## Known bugs

Known bugs and possible improvements include:
* Each time more images are loaded, older images may be fetched. Therefore, one may have to scroll back to the top to see them (if images sorted by date).
* When clicking back in the browser, the previous category selected isn't loaded.
* It would be nice to display a larger version when clicked, including author name, license, description, etc, before giving the option to open in Wikimedia Commons.
* Better filtering options like multiple categories (union or intersection), keywords, etc may be provided.
* Images under category's subcategories should be shown too.
