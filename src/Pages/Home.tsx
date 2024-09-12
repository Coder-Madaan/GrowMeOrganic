import { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Paginator } from 'primereact/paginator';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import '../App.css';

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number | null;
  date_end: number | null;
}

const Home = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10); // Dynamic rows per page
  const [selectedArtworks, setSelectedArtworks] = useState<Artwork[]>([]);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [totalRowsToSelect, setTotalRowsToSelect] = useState(0);

  useEffect(() => {
    const fetchArtworks = async () => {
      setLoading(true);
      try {
        const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${currentPage}&limit=${rowsPerPage}`);
        const data = await response.json();
        const artworksData = data.data.map((artwork: any) => ({
          id: artwork.id,
          title: artwork.title,
          place_of_origin: artwork.place_of_origin || 'Unknown',
          artist_display: artwork.artist_display || 'Unknown',
          inscriptions: artwork.inscriptions || 'None',
          date_start: artwork.date_start || null,
          date_end: artwork.date_end || null,
        }));
        setArtworks(artworksData);
        setTotalRecords(data.pagination.total);
      } catch (error) {
        console.error('Error fetching artworks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtworks();
  }, [currentPage, rowsPerPage]);

  const onPageChange = (event: any) => {
    setCurrentPage(event.page + 1);
    setRowsPerPage(event.rows);
  };

  const onSelectionChange = (e: any) => {
    setSelectedArtworks(e.value);
  };

  const onRowSelect = (event: any) => {
    console.log('Row selected', event.data);
  };

  const onRowUnselect = (event: any) => {
    console.log('Row unselected', event.data);
  };

  const toggleDialog = () => {
    setIsDialogVisible((prevState) => !prevState);
  };

  const handleRowSelection = async () => {
    let selectedRows = [...selectedArtworks];
    let remainingRows = totalRowsToSelect - selectedRows.length;

    // Start from the current page and fetch more pages if needed
    for (let page = currentPage; remainingRows > 0 && page <= Math.ceil(totalRecords / rowsPerPage); page++) {
      const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${page}&limit=${rowsPerPage}`);
      const data = await response.json();
      const artworksData = data.data.map((artwork: any) => ({
        id: artwork.id,
        title: artwork.title,
        place_of_origin: artwork.place_of_origin || 'Unknown',
        artist_display: artwork.artist_display || 'Unknown',
        inscriptions: artwork.inscriptions || 'None',
        date_start: artwork.date_start || null,
        date_end: artwork.date_end || null,
      }));

      for (const artwork of artworksData) {
        if (remainingRows > 0 && !selectedRows.some(row => row.id === artwork.id)) {
          selectedRows.push(artwork);
          remainingRows--;
        }
      }

      if (remainingRows <= 0) {
        break;
      }
    }

    setSelectedArtworks(selectedRows);
    setIsDialogVisible(false);
  };

  const headerTemplate = (header: string) => (
    <div className="flex align-items-center">
      {header}
      <i
        className="pi pi-chevron-down ml-2 cursor-pointer"
        onClick={toggleDialog}
      ></i>
    </div>
  );

  const dialogFooter = (
    <div>
      <Button label="Cancel" icon="pi pi-times" onClick={toggleDialog} className="p-button-danger" />
      <Button label="Select" icon="pi pi-check" onClick={handleRowSelection} className="p-button-success" autoFocus />
    </div>
  );

  return (
    <div className={`table-container ${isDialogVisible ? 'blur-background' : ''}`}>
      <DataTable
        value={artworks}
        loading={loading}
        paginator={false}
        rows={rowsPerPage}
        totalRecords={totalRecords}
        lazy
        onPage={onPageChange}
        tableStyle={{ minWidth: '80%', maxWidth: '90%' }}
        selectionMode="multiple"
        selection={selectedArtworks}
        onSelectionChange={onSelectionChange}
        dataKey="id"
        onRowSelect={onRowSelect}
        onRowUnselect={onRowUnselect}
        showGridlines
        className="custom-data-table"
      >
        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
        <Column field="title" header={headerTemplate('Title')} style={{ minWidth: '12rem' }}></Column>
        <Column field="place_of_origin" header={headerTemplate('Place of Origin')} style={{ minWidth: '12rem' }}></Column>
        <Column field="artist_display" header={headerTemplate('Artist Display')} style={{ minWidth: '12rem' }}></Column>
        <Column field="inscriptions" header={headerTemplate('Inscriptions')} style={{ minWidth: '12rem' }}></Column>
        <Column field="date_start" header={headerTemplate('Date Start')} style={{ minWidth: '8rem' }}></Column>
        <Column field="date_end" header={headerTemplate('Date End')} style={{ minWidth: '8rem' }}></Column>
      </DataTable>

      <Paginator
        first={(currentPage - 1) * rowsPerPage}
        rows={rowsPerPage}
        totalRecords={totalRecords}
        onPageChange={onPageChange}
        template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
        rowsPerPageOptions={[5, 10, 20, 50]}
      />

      <Dialog
        header="Select Rows"
        visible={isDialogVisible}
        style={{ width: '400px' }}
        modal
        footer={dialogFooter}
        onHide={toggleDialog}
        className="custom-dialog"
      >
        <p>Select the number of rows to auto-select:</p>
        <InputNumber
          value={totalRowsToSelect}
          onValueChange={(e) => setTotalRowsToSelect(e.value || 0)}
          min={1}
          max={totalRecords}
          placeholder="Enter number of rows"
        />
      </Dialog>
    </div>
  );
};

export default Home;
