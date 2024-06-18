import axios from 'axios'
import { AddOn } from '@/types/addon.type'
import config from '@/configs/config'

export const loadMarketWidgets = async () => {
  // Not handle case have more than 50 widgets yet
  try {
    let res = await axios.get(
      `${config.widgetMarketPlaceBe}/package?category=widget&limit=50&page=1`,
    )
    if (
      res.status == 200 &&
      res.data &&
      res.data.data &&
      Array.isArray(res.data.data)
    ) {
      return res.data.data.map((widget: any) => {
        let parsedWidget = {
          id: widget._id,
          plugin: 'Builtin',
          widget: 'Embedded-Widget',
          icon: widget.thumbnail,
          label: widget.name,
          url: widget.entryUrl,
          desc: widget.shortDesc,
          likes: widget.likes,
          downloads: widget.downloads,
          options: {
            url: widget.entryUrl,
          } as any,
        }
        if (widget.dashboardConfig) {
          try {
            let tmpConfig = JSON.parse(widget.dashboardConfig) as any
            if (tmpConfig && !Array.isArray(tmpConfig)) {
              parsedWidget.options = tmpConfig
              parsedWidget.options.url = parsedWidget.url
            }
          } catch (err_parse) {
            console.log('Error on parse')
          }
        }
        return parsedWidget //return the parsed widget for each widget
      })
    }
  } catch (err) {
    console.error('Error loading market widgets:', err)
  }
  return [] //returns an array even in case of an error or no data
}

export const searchWidget = async (widgetId: any) => {
  try {
    let res = await axios.get(
      `${config.widgetMarketPlaceBe}/package/${widgetId}`,
    )
    if (res.status === 200 && res.data) {
      // Assuming the API returns the widget details directly
      let parsedWidget = {
        id: res.data._id,
        plugin: 'Builtin',
        widget: 'Embedded-Widget',
        icon: res.data.thumbnail,
        label: res.data.name,
        url: res.data.entryUrl || '',
        desc: res.data.fullDesc,
        likes: res.data.likes,
        downloads: res.data.downloads,
        images: res.data.images,
        thumbnail: res.data.thumbnail,
        author: res.data.authors,
        options: {
          url: res.data.entryUrl || '',
        } as any,
      }
      // Handle dashboardConfig if available
      if (res.data.dashboardConfig) {
        try {
          let tmpConfig = JSON.parse(res.data.dashboardConfig) as any
          if (tmpConfig && !Array.isArray(tmpConfig)) {
            parsedWidget.options = tmpConfig
            parsedWidget.options.url = parsedWidget.url
          }
        } catch (err_parse) {
          console.log('Error on parse')
        }
      }
      return parsedWidget
    }
  } catch (err) {
    console.error('Error in searchWidget:', err)
    return null
  }
}

export const loadWidgetReviews = async (widgetId: any) => {
  try {
    let res = await axios.get(
      `${config.widgetMarketPlaceBe}/review?packageId=${widgetId}&limit=20&offset=0`,
    )
    if (res.status === 200 && res.data && res.data.data) {
      return res.data.data.map((review: any) => {
        return {
          id: review._id,
          rating: review.rating,
          content: review.content,
          images: review.images,
          createdBy: review.createdBy,
          createdAt: review.createdAt,
        }
      })
    }
  } catch (err) {
    // console.error("Error in loadWidgetReviews:", err);
    return null
  }
}

export const fetchMarketAddOns = async (
  type: string,
): Promise<AddOn[] | null> => {
  try {
    const response = await axios.get(
      `${config.widgetMarketPlaceBe}/package?type=${type}&exposeCredentials=true`,
    )

    if (response.status === 200 && response.data && response.data.data) {
      const parsedAddOns: AddOn[] = response.data.data.reduce(
        (addons: AddOn[], addon: any) => {
          if (addon.version && typeof addon.version === 'object') {
            const parsedAddon: AddOn = {
              id: addon.version._id,
              type: addon.type,
              name: addon.name,
              image_file: addon.thumbnail,
              description: addon.shortDesc,
              apiKey: addon.team?.accessKey
                ? `${addon.team?.accessKey}@${addon.team?.secretKey}`
                : addon.version.apiKey,
              endpointUrl: addon.version.endpointUrl,
              samples: addon.version.samples,
              rating: addon.rating,
              team: addon.team ? addon.team.name : null,
            }
            if (parsedAddon.type === type) {
              addons.push(parsedAddon)
            }
          } else {
            console.warn(
              'Skipping addon due to missing version information:',
              addon.name,
            )
          }
          return addons
        },
        [],
      )

      return parsedAddOns
    }
    // Ensure a value is returned even when conditions are not met or status is not 200
    return []
  } catch (err) {
    console.error('Error in fetchAddOns:', err)
    return null
  }
}
